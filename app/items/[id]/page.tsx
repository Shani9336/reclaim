import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, timeAgo, getStatusClass, scoreToPercent, getScoreColor, cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import {
  MapPin, Clock, Tag, Award, ArrowLeft, User,
  AlertCircle, CheckCircle, Building, Phone, Mail
} from 'lucide-react';
import { runLocalMatching } from '@/lib/matchingEngine';

const CATEGORY_EMOJI: Record<string, string> = {
  ELECTRONICS: '📱', DOCUMENTS: '📄', WALLET: '👛', KEYS: '🗝️',
  BAGS: '👜', JEWELRY: '💍', CLOTHING: '👕', OTHER: '📦',
};

export const dynamic = 'force-dynamic';

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true, name: true, image: true,
          showEmail: true, showPhone: true, email: true, phone: true,
        },
      },
      space: true,
      lostMatches: {
        include: { foundItem: { select: { id: true, title: true, category: true, images: true } } },
        orderBy: { score: 'desc' },
        take: 3,
      },
      foundMatches: {
        include: { lostItem: { select: { id: true, title: true, category: true, images: true } } },
        orderBy: { score: 'desc' },
        take: 3,
      },
      claims: { where: { status: 'APPROVED' }, take: 1 },
      _count: { select: { claims: true } },
    },
  });

  if (!item) notFound();

  if (
    item.visibility === 'PRIVATE' &&
    session?.user?.id !== item.userId &&
    !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')
  ) {
    notFound();
  }

  const isOwner = session?.user?.id === item.userId;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');
  const isLost = item.type === 'LOST';
  const date = item.dateLost || item.dateFound;
  let matches = isLost ? item.lostMatches : item.foundMatches;

  if (matches.length === 0) {
    await runLocalMatching(item.id);
    const updated = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        lostMatches: {
          include: { foundItem: { select: { id: true, title: true, category: true, images: true } } },
          orderBy: { score: 'desc' },
          take: 3,
        },
        foundMatches: {
          include: { lostItem: { select: { id: true, title: true, category: true, images: true } } },
          orderBy: { score: 'desc' },
          take: 3,
        },
      },
    });
    if (updated) {
      matches = isLost ? updated.lostMatches : updated.foundMatches;
    }
  }

  const showContact =
    (isOwner || isAdmin || item.claims.length > 0) &&
    (item.user.showEmail || item.user.showPhone);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-8 space-y-6">
        {/* Back link */}
        <Link href="/browse" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Browse
        </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {item.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-2 relative aspect-video rounded-xl overflow-hidden bg-muted">
                <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
              </div>
              {item.images.slice(1, 3).map((img, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                  <Image src={img} alt={`${item.title} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-6xl">
              {CATEGORY_EMOJI[item.category]}
            </div>
          )}

          {/* Title + status */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={isLost ? 'destructive' : 'success'}>
                {isLost ? '🔍 Lost' : '✅ Found'}
              </Badge>
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', getStatusClass(item.status))}>
                {item.status}
              </span>
              {item.reward && (
                <Badge variant="warning" className="gap-1">
                  <Award className="h-3 w-3" /> {item.reward}
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-3xl font-bold">{item.title}</h1>
          </div>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
              {item.distinctiveFeatures && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Distinctive Features</p>
                  <p className="text-sm">{item.distinctiveFeatures}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details grid */}
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium mt-0.5">{CATEGORY_EMOJI[item.category]} {item.category}</dd>
                </div>
                {item.color && <div><dt className="text-muted-foreground">Color</dt><dd className="font-medium mt-0.5">{item.color}</dd></div>}
                {item.brand && <div><dt className="text-muted-foreground">Brand</dt><dd className="font-medium mt-0.5">{item.brand}</dd></div>}
                {date && (
                  <div>
                    <dt className="text-muted-foreground">{isLost ? 'Date Lost' : 'Date Found'}</dt>
                    <dd className="font-medium mt-0.5">{formatDate(date)}</dd>
                  </div>
                )}
                {item.timeLost && <div><dt className="text-muted-foreground">Time</dt><dd className="font-medium mt-0.5">{item.timeLost}</dd></div>}
                {item.storageLocation && (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Currently stored at</dt>
                    <dd className="font-medium mt-0.5">{item.storageLocation}</dd>
                  </div>
                )}
                {item.handoverInstructions && (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Handover instructions</dt>
                    <dd className="mt-0.5">{item.handoverInstructions}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Link key={tag} href={`/browse?search=${tag}`}>
                  <span className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs text-muted-foreground transition-colors cursor-pointer">
                    #{tag}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Top matches */}
          {matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  🎯 AI-Found Matches
                  <Badge variant="info">{matches.length} match{matches.length !== 1 ? 'es' : ''}</Badge>
                </CardTitle>
                <CardDescription>
                  Items our AI found that may match yours. Click to view.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {matches.map((m) => {
                  const matchItem = isLost ? (m as any).foundItem : (m as any).lostItem;
                  return (
                    <Link key={m.id} href={`/items/${matchItem.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                          {CATEGORY_EMOJI[matchItem.category] || '📦'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{matchItem.title}</p>
                          <p className="text-xs text-muted-foreground">{isLost ? 'Found item' : 'Lost item'}</p>
                        </div>
                        <div className={cn('text-lg font-bold shrink-0', getScoreColor(m.score))}>
                          {scoreToPercent(m.score)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Location */}
          {(item.locationText || item.space) && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Location</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {item.locationText && (
                  <div className="flex gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{item.locationText}</span>
                  </div>
                )}
                {item.space && (
                  <div className="flex gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{item.space.name}</span>
                  </div>
                )}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>Posted {timeAgo(item.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reporter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {isLost ? 'Reported by' : 'Found by'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                {item.user.image ? (
                  <Image src={item.user.image} alt={item.user.name || 'User'} width={40} height={40} className="rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{item.user.name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">FoundIt member</p>
                </div>
              </div>

              {showContact && (
                <div className="space-y-2">
                  {item.user.showEmail && item.user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${item.user.email}`} className="text-primary hover:underline">
                        {item.user.email}
                      </a>
                    </div>
                  )}
                  {item.user.showPhone && item.user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${item.user.phone}`} className="text-primary hover:underline">
                        {item.user.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claim card */}
          {item.status === 'OPEN' && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 text-center">
                {isOwner ? (
                  <div className="space-y-3">
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      You reported this item
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Other users browsing this item will see the <strong>&quot;This is Mine!&quot;</strong> button here to submit an ownership claim.
                    </p>
                    <Link href={`/claims/new?itemId=${item.id}`}>
                      <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Test Claim Flow (Demo Mode)
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-3">
                      {isLost ? 'Did you find this item?' : 'Is this your lost item?'}
                    </p>
                    {session?.user ? (
                      <Link href={`/claims/new?itemId=${item.id}`}>
                        <Button className="w-full gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {isLost ? 'Report as Found' : 'This is Mine!'}
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/login?callbackUrl=/claims/new?itemId=${item.id}`}>
                        <Button className="w-full gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Sign in to Claim
                        </Button>
                      </Link>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      You&apos;ll need to provide proof of ownership.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <Card className="border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-amber-700">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full text-xs">Mark as Returned</Button>
                <Button variant="outline" size="sm" className="w-full text-xs text-destructive hover:text-destructive">Remove Item</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
