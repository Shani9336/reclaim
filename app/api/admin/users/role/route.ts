import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Auth check: must be logged in as ADMIN or SUPER_ADMIN (or Shani)
    const isLeader = session?.user?.email?.toLowerCase() === 'shaniyadav777am@gmail.com';
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');

    if (!session?.user || (!isAdmin && !isLeader)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the Project Leader or Admin can manage user roles.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId, role } = body;

    if (!targetUserId || !['ADMIN', 'USER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid request. targetUserId and valid role (ADMIN or USER) are required.' },
        { status: 400 }
      );
    }

    // 2. Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Security: Never allow demoting the Project Leader
    if (
      targetUser.email.toLowerCase() === 'shaniyadav777am@gmail.com' ||
      targetUser.role === Role.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: 'Protected: You cannot change the role of the Project Leader.' },
        { status: 400 }
      );
    }

    // 4. Update the user role in the database
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: role as Role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({
      success: true,
      message: `User ${updated.name || updated.email} has been updated to ${updated.role}`,
      user: updated,
    });
  } catch (error: any) {
    console.error('[POST /api/admin/users/role]', error);
    return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 });
  }
}
