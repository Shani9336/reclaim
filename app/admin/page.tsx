import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, timeAgo, cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, Package, CheckCircle, Clock,
  TrendingUp, Users, MapPin, BarChart3, AlertCircle
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const isLeader = session?.user?.email?.toLowerCase() === 'shaniyadav777am@gmail.com';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');

  if (!session?.user || (!isAdmin && !isLeader)) {
    redirect('/browse');
  }

  const [
    totalLost, totalFound, totalMatches, totalClaims, totalUsers,
    recentItems, pendingClaims, matchRate, topCategories
  ] = await Promise.all([
    prisma.item.count({ where: { type: 'LOST' } }),
    prisma.item.count({ where: { type: 'FOUND' } }),
    prisma.match.count(),
    prisma.claim.count(),
    prisma.user.count(),
    prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: { select: { name: true, image: true } },
        space: { select: { name: true } },
      },
    }),
    prisma.claim.findMany({
      where: { status: 'PENDING' },
      include: {
        claimant: { select: { name: true, image: true } },
        item: { select: { id: true, title: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.match.count({ where: { score: { gte: 0.7 } } }),
    prisma.item.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const matchRatePercent = totalMatches > 0
    ? Math.round((matchRate / totalMatches) * 100)
    : 0;

  const stats = [
    { label: 'Total Lost', value: totalLost, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
    { label: 'Total Found', value: totalFound, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
    { label: 'Total Members', value: totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20' },
    { label: 'AI Matches', value: totalMatches, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Match Rate (>70%)', value: `${matchRatePercent}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Pending Claims', value: pendingClaims.length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Overview of all lost and found activity across Devkiba College.</p>
        </div>
        <Link href="/admin/users">
          <Button variant="outline" className="gap-2 border-red-300 text-red-600 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold">
            <Users className="h-4 w-4" /> Manage User Roles
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', bg)}>
                  <Icon className={cn('h-5 w-5', color)} />
                </div>
                <div>
                  <div className="text-2xl font-heading font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending claims */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Pending Claims
                {pendingClaims.length > 0 && (
                  <Badge variant="warning">{pendingClaims.length}</Badge>
                )}
              </CardTitle>
              <Link href="/admin/claims">
                <Button variant="ghost" size="sm" className="text-xs">View all →</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingClaims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">All claims reviewed! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingClaims.map((claim) => (
                    <div key={claim.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      {claim.claimant.image ? (
                        <Image src={claim.claimant.image} alt="" width={36} height={36} className="rounded-full shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {claim.claimant.name} → {claim.item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo(claim.createdAt)}</p>
                      </div>
                      <Link href={`/admin/claims?id=${claim.id}`}>
                        <Button size="sm" variant="outline" className="shrink-0 text-xs">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCategories.map((cat, i) => {
              const maxCount = topCategories[0]._count.id;
              const pct = Math.round((cat._count.id / maxCount) * 100);
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-muted-foreground">{cat._count.id}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Reports</CardTitle>
          <Link href="/admin/items">
            <Button variant="ghost" size="sm" className="text-xs">View all →</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Item</th>
                  <th className="text-left py-2 pr-4 font-medium">Type</th>
                  <th className="text-left py-2 pr-4 font-medium">Category</th>
                  <th className="text-left py-2 pr-4 font-medium">Reporter</th>
                  <th className="text-left py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 pr-4">
                      <Link href={`/items/${item.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={item.type === 'LOST' ? 'destructive' : 'success'} className="text-xs">
                        {item.type}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{item.category}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{item.user.name || 'Unknown'}</td>
                    <td className="py-2 text-muted-foreground text-xs">{timeAgo(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
