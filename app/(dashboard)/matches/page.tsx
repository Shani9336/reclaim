import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, scoreToPercent, getScoreColor } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { scanAllDatabaseMatches } from '@/lib/matchingEngine';
import { RescanMatchesButton } from '@/components/matches/RescanMatchesButton';

export const dynamic = 'force-dynamic';

export default async function MatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  // Get all items belonging to this user
  const userItems = await prisma.item.findMany({
    where: { userId: session.user.id },
    select: { id: true, type: true },
  });

  const lostIds = userItems.filter((i) => i.type === 'LOST').map((i) => i.id);
  const foundIds = userItems.filter((i) => i.type === 'FOUND').map((i) => i.id);

  // Auto-scan if user has items but 0 matches found yet
  let matches = await prisma.match.findMany({
    where: {
      OR: [
        { lostItemId: { in: lostIds } },
        { foundItemId: { in: foundIds } },
      ],
    },
    include: {
      lostItem: { include: { user: { select: { id: true, name: true } } } },
      foundItem: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { score: 'desc' },
  });

  if (matches.length === 0 && (lostIds.length > 0 || foundIds.length > 0)) {
    await scanAllDatabaseMatches();
    matches = await prisma.match.findMany({
      where: {
        OR: [
          { lostItemId: { in: lostIds } },
          { foundItemId: { in: foundIds } },
        ],
      },
      include: {
        lostItem: { include: { user: { select: { id: true, name: true } } } },
        foundItem: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { score: 'desc' },
    });
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return { label: 'Excellent', variant: 'success' as const };
    if (score >= 0.8) return { label: 'Very Good', variant: 'success' as const };
    if (score >= 0.7) return { label: 'Good', variant: 'warning' as const };
    return { label: 'Possible', variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-3xl font-bold">My Matches</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered matches between your lost and found reports.
          </p>
        </div>
        <RescanMatchesButton />
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground mb-4">
              Report a lost or found item and our AI will automatically search for matches.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/lost/new" className="text-sm text-primary hover:underline">Report Lost Item →</Link>
              <Link href="/found/new" className="text-sm text-primary hover:underline">Report Found Item →</Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const { label, variant } = getScoreLabel(match.score);
            const reasoning = match.reasoning as Record<string, number>;

            return (
              <Card key={match.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Match score */}
                    <div className="text-center shrink-0">
                      <div className={cn('text-3xl font-heading font-bold', getScoreColor(match.score))}>
                        {scoreToPercent(match.score)}
                      </div>
                      <Badge variant={variant} className="text-xs mt-1">{label} Match</Badge>
                    </div>

                    {/* Item pair */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 items-center">
                      <Link href={`/items/${match.lostItemId}`} className="hover:text-primary transition-colors">
                        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
                          <p className="text-xs text-red-500 font-semibold uppercase mb-1">Lost</p>
                          <p className="font-medium text-sm line-clamp-2">{match.lostItem.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">by {match.lostItem.user.name}</p>
                        </div>
                      </Link>

                      <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block shrink-0" />

                      <Link href={`/items/${match.foundItemId}`} className="hover:text-primary transition-colors">
                        <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3">
                          <p className="text-xs text-green-600 font-semibold uppercase mb-1">Found</p>
                          <p className="font-medium text-sm line-clamp-2">{match.foundItem.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">by {match.foundItem.user.name}</p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Reasoning breakdown */}
                  {reasoning && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Score breakdown:</p>
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(reasoning).map(([key, val]) => (
                          <div key={key} className="text-center">
                            <div className="text-sm font-semibold">{Math.round(val * 100)}%</div>
                            <div className="text-xs text-muted-foreground capitalize">{key}</div>
                            <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${val * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status + actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant={match.status === 'CONFIRMED' ? 'success' : 'secondary'}>
                      {match.status}
                    </Badge>
                    <Link href={`/items/${match.lostItemId}`}>
                      <button className="text-sm text-primary hover:underline flex items-center gap-1">
                        View details <ArrowRight className="h-3 w-3" />
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
