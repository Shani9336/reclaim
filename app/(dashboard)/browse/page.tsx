'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ItemCard } from '@/components/items/ItemCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Grid, List, Filter, X, Loader2, PackageSearch } from 'lucide-react';
import { CATEGORIES } from '@/lib/validators/item';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  type: 'LOST' | 'FOUND';
  title: string;
  description: string;
  category: string;
  color?: string | null;
  brand?: string | null;
  images: string[];
  tags: string[];
  status: string;
  reward?: string | null;
  locationText?: string | null;
  dateLost?: string | null;
  dateFound?: string | null;
  createdAt: string;
  user?: { id: string; name?: string | null; image?: string | null };
  space?: { id: string; name: string } | null;
}

interface ItemsResponse {
  items: Item[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export default function BrowsePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Read filters from URL
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || 'ALL';
  const category = searchParams.get('category') || 'ALL';
  const status = searchParams.get('status') || 'ALL';
  const page = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset page on filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  const queryString = new URLSearchParams({
    ...(search && { search }),
    ...(type !== 'ALL' && { type }),
    ...(category !== 'ALL' && { category }),
    ...(status !== 'ALL' && { status }),
    page: page.toString(),
    limit: '12',
  }).toString();

  const { data, isLoading } = useQuery<ItemsResponse>({
    queryKey: ['items', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/items?${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch items');
      return res.json();
    },
  });

  const activeFilters = [
    type !== 'ALL' && { key: 'type', value: type },
    category !== 'ALL' && { key: 'category', value: category },
    status !== 'ALL' && { key: 'status', value: status },
  ].filter(Boolean) as { key: string; value: string }[];

const QUICK_CATS = [
  { name: 'All', icon: '✨', category: 'ALL' },
  { name: 'Keys', icon: '🗝️', category: 'KEYS' },
  { name: 'Wallet', icon: '👛', category: 'WALLET' },
  { name: 'Phone/Laptop', icon: '📱', category: 'ELECTRONICS' },
  { name: 'Documents', icon: '📄', category: 'DOCUMENTS' },
  { name: 'Backpack', icon: '🎒', category: 'BAGS' },
  { name: 'Clothing', icon: '🧥', category: 'CLOTHING' },
  { name: 'Jewelry', icon: '💍', category: 'JEWELRY' },
  { name: 'Other', icon: '📦', category: 'OTHER' },
];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold">Browse Items</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {data?.pagination.total ?? '...'} items reported in our campus and community
        </p>
      </div>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_CATS.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => updateParam('category', cat.category)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all cursor-pointer',
              category === cat.category
                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items, locations, brands..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateParam('search', searchInput);
                }
              }}
            />
          </div>
          <Button
            type="button"
            onClick={() => updateParam('search', searchInput)}
            className="shrink-0"
          >
            Search
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Type filter */}
          <Select value={type} onValueChange={(v) => updateParam('type', v)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="LOST">🔍 Lost</SelectItem>
              <SelectItem value="FOUND">✅ Found</SelectItem>
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={category} onValueChange={(v) => updateParam('category', v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={cn('rounded-none h-10 w-10', view === 'grid' && 'bg-muted')}
              onClick={() => setView('grid')}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn('rounded-none h-10 w-10', view === 'list' && 'bg-muted')}
              onClick={() => setView('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {activeFilters.map((f) => (
            <Badge
              key={f.key}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => updateParam(f.key, 'ALL')}
            >
              {f.value}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => router.push(pathname)}>
            Clear all
          </Button>
        </div>
      )}

      {/* Items grid/list */}
      {isLoading ? (
        <div className={cn(
          'grid gap-4',
          view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-muted animate-pulse h-72" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-24">
          <PackageSearch className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-6">
            {search ? `No results for "${search}". Try different keywords.` : 'Be the first to report an item in this category!'}
          </p>
          <Button onClick={() => router.push('/lost/new')}>Report a Lost Item</Button>
        </div>
      ) : (
        <div className={cn(
          'grid gap-4',
          view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          {data?.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pagination.totalPages}
            onClick={() => updateParam('page', String(page + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
