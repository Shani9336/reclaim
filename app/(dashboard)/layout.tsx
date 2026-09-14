import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Dashboard — FoundIt',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
