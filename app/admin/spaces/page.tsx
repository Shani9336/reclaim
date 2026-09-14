import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Package, Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function AdminSpacesPage() {
  const spaces = await prisma.space.findMany({
    include: {
      admin: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const spaceTypeBadges: Record<string, string> = {
    CAMPUS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    MALL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    METRO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    AIRPORT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    RAILWAY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-3xl font-bold">Managed Spaces</h1>
          </div>
          <p className="text-muted-foreground">
            Registered campuses, transit hubs, and public spaces on the ReClaim network.
          </p>
        </div>
      </div>

      {/* Spaces Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => (
          <Card key={space.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg font-semibold">{space.name}</CardTitle>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${spaceTypeBadges[space.type] || spaceTypeBadges.OTHER}`}>
                  {space.type}
                </span>
              </div>
              <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{space.address}, {space.city}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {space.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {space.description}
                </p>
              )}

              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span><strong>{space._count.items}</strong> items logged</span>
                </div>
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Active</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Managed by: <strong>{space.admin.name || space.admin.email}</strong>
              </div>

              <Link href={`/browse?spaceId=${space.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full text-xs mt-1">
                  View Space Items
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
