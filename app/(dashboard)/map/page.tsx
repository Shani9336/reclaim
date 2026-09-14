'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import { CATEGORIES } from '@/lib/validators/item';

// Dynamically import Leaflet to avoid SSR issues (Leaflet uses window)
const ItemMap = dynamic(() => import('@/components/map/ItemMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-xl bg-muted flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function MapPage() {
  const [type, setType] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  const queryString = new URLSearchParams({
    ...(type !== 'ALL' && { type }),
    ...(category !== 'ALL' && { category }),
    limit: '100',
    status: 'OPEN',
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ['map-items', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/items?${queryString}`);
      return res.json();
    },
  });

  const items = data?.items || [];
  const lostCount = items.filter((i: any) => i.type === 'LOST').length;
  const foundCount = items.filter((i: any) => i.type === 'FOUND').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Map View</h1>
        </div>
        <p className="text-muted-foreground">All open items plotted on an interactive map.</p>
      </div>

      {/* Filters + stats bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="LOST">🔍 Lost</SelectItem>
            <SelectItem value="FOUND">✅ Found</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Badge variant="destructive" className="gap-1">🔍 {lostCount} Lost</Badge>
              <Badge variant="success" className="gap-1">✅ {foundCount} Found</Badge>
            </>
          )}
        </div>
      </div>

      {/* Map */}
      <ItemMap items={items} />

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          Lost item
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          Found item
        </div>
        <p className="ml-auto text-xs">Click a marker to view details</p>
      </div>
    </div>
  );
}
