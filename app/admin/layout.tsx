import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Admin Portal — ReClaim',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isLeader = session?.user?.email?.toLowerCase() === 'shaniyadav777am@gmail.com';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');

  if (!session?.user || (!isAdmin && !isLeader)) {
    redirect('/browse');
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container flex gap-0 md:gap-8 py-8">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
