import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/items/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            // Only show contact info if user allows it
            showEmail: true,
            showPhone: true,
            email: true,
            phone: true,
          },
        },
        space: true,
        claims: {
          include: { claimant: { select: { id: true, name: true, image: true } } },
          where: session?.user
            ? { claimantId: session.user.id }
            : { id: 'never' },
        },
        lostMatches: {
          include: {
            foundItem: {
              include: { user: { select: { id: true, name: true, image: true } } },
            },
          },
          where: { score: { gte: 0.5 } },
          orderBy: { score: 'desc' },
          take: 5,
        },
        foundMatches: {
          include: {
            lostItem: {
              include: { user: { select: { id: true, name: true, image: true } } },
            },
          },
          where: { score: { gte: 0.5 } },
          orderBy: { score: 'desc' },
          take: 5,
        },
        _count: { select: { claims: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Hide private items from non-admins unless it's the owner
    if (
      item.visibility === 'PRIVATE' &&
      session?.user?.id !== item.userId &&
      !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')
    ) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Mask contact info if not revealed yet
    const isOwner = session?.user?.id === item.userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');
    if (!isOwner && !isAdmin) {
      item.user.email = item.user.showEmail ? item.user.email : null;
      item.user.phone = item.user.showPhone ? item.user.phone : null;
    }

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/items/[id] — update item status or details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.item.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = session.user.id === item.userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = isAdmin
      ? ['status', 'visibility', 'title', 'description']
      : ['title', 'description', 'locationText', 'reward', 'visibility'];

    const updates: any = {};
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    const updated = await prisma.item.update({
      where: { id: params.id },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/items/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.item.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = session.user.id === item.userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.item.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
