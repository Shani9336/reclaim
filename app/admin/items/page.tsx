import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { AdminItemsClient } from '@/components/admin/AdminItemsClient';

export const dynamic = 'force-dynamic';

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  const isLeader = session?.user?.email?.toLowerCase() === 'shaniyadav777am@gmail.com';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');

  if (!session?.user || (!isAdmin && !isLeader)) {
    redirect('/browse');
  }

  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const where: any = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.type) where.type = searchParams.type;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        space: { select: { id: true, name: true } },
        _count: { select: { claims: true, reports: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.item.count({ where }),
  ]);

  return (
    <AdminItemsClient
      initialItems={items}
      total={total}
      page={page}
      limit={limit}
    />
  );
}
