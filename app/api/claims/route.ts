import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClaimSchema, reviewClaimSchema } from '@/lib/validators/claim';
import { claimLimiter } from '@/lib/redis';
import { getIpFromHeaders } from '@/lib/utils';
import { sendClaimUpdateEmail } from '@/lib/resend';

// POST /api/claims — submit a new claim
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit claim submissions
    const ip = getIpFromHeaders(request.headers);
    const { success } = await claimLimiter.limit(session.user.id);
    if (!success) {
      return NextResponse.json({ error: 'Too many claims. Please wait before submitting another.' }, { status: 429 });
    }

    const body = await request.json();
    const validated = createClaimSchema.parse(body);

    // Check item exists and is claimable
    const item = await prisma.item.findUnique({
      where: { id: validated.itemId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (item.status === 'CLOSED') return NextResponse.json({ error: 'This item is closed' }, { status: 400 });
    if (item.userId === session.user.id && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'You cannot claim your own item' }, { status: 400 });
    }

    // Check for duplicate claim
    const existing = await prisma.claim.findFirst({
      where: { itemId: validated.itemId, claimantId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a claim for this item' }, { status: 409 });
    }

    const claim = await prisma.claim.create({
      data: {
        itemId: validated.itemId,
        description: validated.description.trim(),
        proofText: validated.proofText?.trim() || null,
        proofImages: validated.proofImages || [],
        claimantId: session.user.id,
        status: 'PENDING',
      },
      include: {
        claimant: { select: { id: true, name: true, email: true } },
        item: { select: { id: true, title: true, type: true } },
      },
    });

    // Update item status
    await prisma.item.update({
      where: { id: validated.itemId },
      data: { status: 'CLAIMED' },
    });

    // Notify the item owner
    await prisma.notification.create({
      data: {
        userId: item.userId,
        type: 'CLAIM_SUBMITTED',
        title: `New claim on your ${item.type.toLowerCase()} item`,
        body: `${claim.claimant.name || 'Someone'} has submitted a claim for "${item.title}". Review it in your admin panel.`,
        link: `/admin/claims`,
      },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/claims — list claims (admin: all; user: their own)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const where: any = isAdmin ? {} : { claimantId: session.user.id };
    if (status) where.status = status;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: {
          claimant: { select: { id: true, name: true, email: true, image: true } },
          item: { select: { id: true, title: true, type: true, category: true, images: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.claim.count({ where }),
    ]);

    return NextResponse.json({
      claims,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/claims — admin review (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = reviewClaimSchema.parse(body);

    const claim = await prisma.claim.findUnique({
      where: { id: validated.claimId },
      include: {
        claimant: true,
        item: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });

    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

    const updated = await prisma.claim.update({
      where: { id: validated.claimId },
      data: {
        status: validated.status,
        adminNote: validated.adminNote,
        adminId: session.user.id,
        reviewedAt: new Date(),
      },
    });

    // Update item status
    const newItemStatus = validated.status === 'APPROVED' ? 'VERIFIED' : 'OPEN';
    await prisma.item.update({
      where: { id: claim.itemId },
      data: { status: newItemStatus },
    });

    // Notify claimant
    const notifType = validated.status === 'APPROVED' ? 'CLAIM_APPROVED' : 'CLAIM_REJECTED';
    await prisma.notification.create({
      data: {
        userId: claim.claimantId,
        type: notifType,
        title: `Your claim was ${validated.status === 'APPROVED' ? 'approved ✅' : 'rejected ❌'}`,
        body: validated.adminNote || `Your claim for "${claim.item.title}" has been ${validated.status.toLowerCase()}.`,
        link: `/claims/${claim.id}`,
      },
    });

    // Send email notification
    if (claim.claimant.email) {
      sendClaimUpdateEmail(claim.claimant.email, {
        itemTitle: claim.item.title,
        claimStatus: validated.status as 'APPROVED' | 'REJECTED',
        adminNote: validated.adminNote,
        claimUrl: `${process.env.NEXT_PUBLIC_APP_URL}/claims/${claim.id}`,
        recipientName: claim.claimant.name || 'User',
      }).catch(console.error);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
