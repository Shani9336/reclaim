import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { AdminClaimsClient } from '@/components/admin/AdminClaimsClient';

export default async function AdminClaimsPage() {
  const session = await getServerSession(authOptions);
  const isLeader = session?.user?.email?.toLowerCase() === 'shaniyadav777am@gmail.com';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');

  if (!session?.user || (!isAdmin && !isLeader)) {
    redirect('/browse');
  }

  const claims = await prisma.claim.findMany({
    include: {
      claimant: { select: { id: true, name: true, email: true, image: true } },
      item: {
        select: {
          id: true, title: true, type: true, category: true,
          images: true, distinctiveFeatures: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return <AdminClaimsClient initialClaims={claims} adminId={session.user.id} />;
}
