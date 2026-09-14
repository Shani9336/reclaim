import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { timeAgo, cn } from '@/lib/utils';
import Link from 'next/link';
import { Package, ExternalLink } from 'lucide-react';

const STATUS_VARIANT: Record<string, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

export default async function ClaimsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const claims = await prisma.claim.findMany({
    where: { claimantId: session.user.id },
    include: {
      item: {
        select: {
          id: true, title: true, type: true, category: true,
          images: true, status: true, locationText: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold">My Claims</h1>
        </div>
        <p className="text-muted-foreground">
          Track the status of your ownership claims.
        </p>
      </div>

      {claims.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">No claims yet</h3>
            <p className="text-muted-foreground mb-4">
              When you find your lost item in our database, click &quot;This is mine!&quot; to submit a claim.
            </p>
            <Link href="/browse" className="text-primary hover:underline text-sm">
              Browse found items →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.id} className={cn(
              'overflow-hidden',
              claim.status === 'PENDING' && 'border-amber-200 dark:border-amber-800',
              claim.status === 'APPROVED' && 'border-green-200 dark:border-green-800',
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Item image / emoji */}
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {claim.item.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={claim.item.images[0]}
                        alt={claim.item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      claim.item.type === 'LOST' ? '🔍' : '✅'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <Link
                          href={`/items/${claim.item.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {claim.item.title}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {claim.item.category}
                          {claim.item.locationText && ` · ${claim.item.locationText}`}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[claim.status] as any}>
                        {claim.status}
                      </Badge>
                    </div>

                    {/* Description preview */}
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {claim.description}
                    </p>

                    {/* Admin note if any */}
                    {claim.adminNote && (
                      <div className={cn(
                        'mt-2 rounded-lg p-2.5 text-sm',
                        claim.status === 'APPROVED'
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                      )}>
                        <strong>Admin note:</strong> {claim.adminNote}
                      </div>
                    )}

                    {/* Footer meta */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>Submitted {timeAgo(claim.createdAt)}</span>
                      {claim.status === 'APPROVED' && (
                        <Link
                          href={`/items/${claim.item.id}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View contact details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status guide */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
        <p className="font-semibold">Claim status guide</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground text-xs">
          <div className="flex items-start gap-2">
            <Badge variant="warning" className="shrink-0 mt-0.5">PENDING</Badge>
            <span>Admin is reviewing your claim. Usually resolved within 24h.</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="success" className="shrink-0 mt-0.5">APPROVED</Badge>
            <span>You&apos;re verified as the owner. Contact info is now revealed.</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="destructive" className="shrink-0 mt-0.5">REJECTED</Badge>
            <span>Claim was denied. See admin note for reason.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
