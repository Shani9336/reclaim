import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

export const metadata = {
  title: 'User Roles & Admin Control — ReClaim',
};

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  const isLeader = session?.user?.email?.toLowerCase() === 'shaniyadav777am@gmail.com';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');

  if (!session?.user || (!isAdmin && !isLeader)) {
    redirect('/browse');
  }

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          items: true,
          claims: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminUsersClient
      initialUsers={users}
      currentUserEmail={session.user.email || ''}
    />
  );
}
