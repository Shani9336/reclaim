import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLostItemSchema, createFoundItemSchema, itemFilterSchema } from '@/lib/validators/item';
import { itemReportLimiter, searchLimiter } from '@/lib/redis';
import { getIpFromHeaders, extractTags } from '@/lib/utils';

// GET /api/items — browse and search items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = getIpFromHeaders(request.headers);

    // Rate limit searches
    const { success } = await searchLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const params = Object.fromEntries(searchParams.entries());
    const filters = itemFilterSchema.parse(params);

    const where: any = {};

    if (filters.type !== 'ALL') where.type = filters.type;
    if (filters.category !== 'ALL') where.category = filters.category;
    if (filters.status !== 'ALL') where.status = filters.status;
    if (filters.color) where.color = { contains: filters.color, mode: 'insensitive' };
    if (filters.spaceId) where.spaceId = filters.spaceId;

    // Full-text search
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search.toLowerCase() } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { locationText: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Date range
    if (filters.dateFrom || filters.dateTo) {
      where.OR = [
        ...(where.OR || []),
        {
          dateLost: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
          },
        },
        {
          dateFound: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
          },
        },
      ];
    }

    const session = await getServerSession(authOptions);

    if (filters.userId) {
      if (filters.userId === 'me') {
        if (session?.user?.id) {
          where.userId = session.user.id;
        }
      } else {
        where.userId = filters.userId;
      }
    }

    // Only show public items unless user is admin or viewing their own items
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');
    const isViewingOwn = where.userId && session?.user?.id && where.userId === session.user.id;

    if (!isAdmin && !isViewingOwn) {
      where.visibility = 'PUBLIC';
    }

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          space: { select: { id: true, name: true, type: true } },
          _count: { select: { claims: true, lostMatches: true, foundMatches: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error: any) {
    console.error('[GET /api/items]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// POST /api/items — create a new item report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit item creation
    const ip = getIpFromHeaders(request.headers);
    const { success } = await itemReportLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'You are creating items too quickly. Please wait and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (!type || !['LOST', 'FOUND'].includes(type)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    // Validate with appropriate schema
    const validated =
      type === 'LOST'
        ? createLostItemSchema.parse(data)
        : createFoundItemSchema.parse(data);

    // Auto-generate tags from title + description
    const autoTags = extractTags(`${validated.title} ${validated.description}`);
    const tags = [...new Set([...validated.tags, ...autoTags])];

    const itemData: any = {
      type,
      title: validated.title.trim(),
      description: validated.description.trim(),
      category: validated.category,
      color: validated.color?.trim() || null,
      brand: validated.brand?.trim() || null,
      locationText: validated.locationText?.trim() || null,
      locationLat: typeof validated.locationLat === 'number' ? validated.locationLat : null,
      locationLng: typeof validated.locationLng === 'number' ? validated.locationLng : null,
      images: validated.images || [],
      tags,
      userId: session.user.id,
      spaceId: validated.spaceId?.trim() || null,
    };

    if (type === 'LOST') {
      const lostVal = validated as any;
      itemData.dateLost = lostVal.dateLost && lostVal.dateLost.trim() ? new Date(lostVal.dateLost) : null;
      itemData.timeLost = lostVal.timeLost?.trim() || null;
      itemData.distinctiveFeatures = lostVal.distinctiveFeatures?.trim() || null;
      itemData.reward = lostVal.reward?.trim() || null;
    } else {
      const foundVal = validated as any;
      itemData.dateFound = foundVal.dateFound && foundVal.dateFound.trim() ? new Date(foundVal.dateFound) : null;
      itemData.storageLocation = foundVal.storageLocation?.trim() || null;
      itemData.handoverInstructions = foundVal.handoverInstructions?.trim() || null;
      itemData.visibility = foundVal.visibility || 'PUBLIC';
    }

    const item = await prisma.item.create({
      data: itemData,
      include: {
        user: { select: { id: true, name: true, image: true } },
        space: { select: { id: true, name: true, type: true } },
      },
    });

    // Trigger matching in background (fire and forget)
    triggerMatching(item.id, type, session.user.id).catch(console.error);

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/items]', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

import { runLocalMatching } from '@/lib/matchingEngine';

/**
 * Triggers item matching after a new item is posted.
 * Uses the built-in TypeScript matching engine first (instant, 100% reliable),
 * with optional Python service verification if online.
 */
async function triggerMatching(itemId: string, type: 'LOST' | 'FOUND', userId: string) {
  // 1. Run built-in matching engine
  try {
    await runLocalMatching(itemId);
  } catch (err) {
    console.error('[triggerMatching] Local matching error:', err);
  }

  const MATCHING_URL = process.env.MATCHING_SERVICE_URL;
  if (!MATCHING_URL) return;

  try {
    // Fetch the new item
    const newItem = await prisma.item.findUnique({ where: { id: itemId } });
    if (!newItem) return;

    // Fetch candidate items of opposite type
    const candidateType = type === 'LOST' ? 'FOUND' : 'LOST';
    const candidates = await prisma.item.findMany({
      where: {
        type: candidateType,
        status: 'OPEN',
        category: newItem.category,
      },
      take: 50,
    });

    if (candidates.length === 0) return;

    // Call Python matching service
    const response = await fetch(`${MATCHING_URL}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.MATCHING_SERVICE_API_KEY || 'dev-secret-key',
      },
      body: JSON.stringify({
        lost_item: {
          id: newItem.id,
          title: newItem.title,
          description: newItem.description,
          category: newItem.category,
          color: newItem.color,
          brand: newItem.brand,
          tags: newItem.tags,
          date_lost: newItem.dateLost?.toISOString(),
          date_found: newItem.dateFound?.toISOString(),
          distinctive_features: newItem.distinctiveFeatures,
        },
        found_items: candidates.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          color: c.color,
          brand: c.brand,
          tags: c.tags,
          date_lost: c.dateLost?.toISOString(),
          date_found: c.dateFound?.toISOString(),
          distinctive_features: c.distinctiveFeatures,
        })),
        top_k: 10,
      }),
    });

    if (!response.ok) return;

    const { matches } = await response.json();

    // Save high-scoring matches to DB and notify users
    const NOTIFY_THRESHOLD = 0.7;

    for (const match of matches) {
      if (match.score < NOTIFY_THRESHOLD) continue;

      const [lostItemId, foundItemId] =
        type === 'LOST'
          ? [itemId, match.found_item_id]
          : [match.found_item_id, itemId];

      // Upsert match record
      const savedMatch = await prisma.match.upsert({
        where: { lostItemId_foundItemId: { lostItemId, foundItemId } },
        create: { lostItemId, foundItemId, score: match.score, reasoning: match.reasoning },
        update: { score: match.score, reasoning: match.reasoning },
      });

      // Notify the reporting user
      await prisma.notification.create({
        data: {
          userId,
          type: 'MATCH_FOUND',
          title: `Match Found! ${Math.round(match.score * 100)}% match`,
          body: `We found a potential match for your ${type.toLowerCase()} item. Check it out!`,
          link: `/matches`,
        },
      });
    }
  } catch (err) {
    console.error('[triggerMatching]', err);
  }
}
