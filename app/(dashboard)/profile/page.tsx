import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Clock, CheckCircle, AlertCircle, User, MapPin, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const [user, itemStats, recentItems, recentClaims] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, role: true, createdAt: true, bio: true },
    }),
    prisma.item.groupBy({
      by: ['type', 'status'],
      where: { userId: session.user.id },
      _count: { id: true },
    }),
    prisma.item.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, type: true, status: true, category: true, createdAt: true },
    }),
    prisma.claim.findMany({
      where: { claimantId: session.user.id },
      include: { item: { select: { id: true, title: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  if (!user) redirect('/login');

  const totalLost = itemStats.filter((s) => s.type === 'LOST').reduce((sum, s) => sum + s._count.id, 0);
  const totalFound = itemStats.filter((s) => s.type === 'FOUND').reduce((sum, s) => sum + s._count.id, 0);
  const totalReturned = itemStats.filter((s) => s.status === 'RETURNED').reduce((sum, s) => sum + s._count.id, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {user.image ? (
              <Image src={user.image} alt={user.name || ''} width={80} height={80} className="rounded-full shrink-0" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-10 w-10 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading text-2xl font-bold">{user.name || 'Anonymous User'}</h1>
                {user.role === 'SUPER_ADMIN' ? (
                  <Badge variant="warning" className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 font-semibold">
                    👑 Project Leader
                  </Badge>
                ) : user.role === 'ADMIN' ? (
                  <Badge variant="info" className="font-semibold">
                    🛡️ Staff Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary">Member</Badge>
                )}

                {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                  <Link href="/admin">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-300 text-red-600 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Admin Dashboard →
                    </Button>
                  </Link>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
              {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Lost Reports', value: totalLost, icon: AlertCircle, color: 'text-red-500' },
          { label: 'Found Reports', value: totalFound, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Items Returned', value: totalReturned, icon: Package, color: 'text-primary' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6 text-center">
              <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
              <div className="text-2xl font-heading font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            My Reports
            <Link href="/browse?userId=me" className="text-xs text-primary hover:underline font-normal">
              View all →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No reports yet.{' '}
              <Link href="/lost/new" className="text-primary hover:underline">Report a lost item →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.category} · {timeAgo(item.createdAt)}</p>
                    </div>
                    <Badge variant={item.status === 'OPEN' ? 'secondary' : 'success'} className="text-xs shrink-0">
                      {item.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent claims */}
      {recentClaims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Claims</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentClaims.map((claim) => (
              <div key={claim.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">Claimed: {claim.item.title}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(claim.createdAt)}</p>
                </div>
                <Badge
                  variant={claim.status === 'APPROVED' ? 'success' : claim.status === 'REJECTED' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {claim.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
