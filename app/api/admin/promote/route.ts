import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/promote — Promotes the currently logged in user to ADMIN
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/api/admin/promote', request.url));
    }

    // Only allow if user is the Project Leader (SUPER_ADMIN)
    if (session.user.role !== 'SUPER_ADMIN' && session.user.email !== 'shaniyadav777am@gmail.com') {
      return NextResponse.json(
        { error: 'Forbidden: Only the Project Leader has permission to manage admin roles.' },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' },
    });

    return NextResponse.redirect(new URL('/admin', request.url));
  } catch (error: any) {
    console.error('[GET /api/admin/promote]', error);
    return NextResponse.json({ error: error.message || 'Promotion failed' }, { status: 500 });
  }
}
