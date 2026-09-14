'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { timeAgo, getStatusClass, cn } from '@/lib/utils';
import { Package, AlertTriangle, ExternalLink, Trash2, CheckSquare } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface AdminItem {
  id: string;
  type: 'LOST' | 'FOUND';
  title: string;
  category: string;
  status: string;
  images: string[];
  createdAt: string;
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  space?: { id: string; name: string } | null;
  _count: { claims: number; reports: number };
}

interface AdminItemsClientProps {
  initialItems: AdminItem[];
  total: number;
  page: number;
  limit: number;
}

const ITEM_STATUSES = ['OPEN', 'CLAIMED', 'VERIFIED', 'RETURNED', 'CLOSED'];

export function AdminItemsClient({ initialItems, total, page, limit }: AdminItemsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initialItems);
  const [updating, setUpdating] = useState<string | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  async function updateStatus(itemId: string, status: string) {
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status } : i));
      toast({ title: `Status updated to ${status}` });
    } catch {
      toast({ title: 'Error', description: 'Could not update status', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast({ title: 'Item deleted' });
    } catch {
      toast({ title: 'Error', description: 'Could not delete item', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Moderate Items</h1>
        </div>
        <p className="text-muted-foreground">{total} total items — update status or remove inappropriate reports.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select
          defaultValue={searchParams.get('type') || ''}
          onValueChange={(v) => updateParam('type', v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="LOST">🔍 Lost</SelectItem>
            <SelectItem value="FOUND">✅ Found</SelectItem>
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get('status') || ''}
          onValueChange={(v) => updateParam('status', v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ITEM_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Items table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Reporter</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Posted</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  {/* Item info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.images[0] ? (
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-lg">
                          📦
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/items/${item.id}`}
                            target="_blank"
                            className="font-medium hover:text-primary transition-colors line-clamp-1 max-w-[180px]"
                          >
                            {item.title}
                          </Link>
                          <Badge variant={item.type === 'LOST' ? 'destructive' : 'success'} className="text-xs">
                            {item.type}
                          </Badge>
                          {item._count.reports > 0 && (
                            <Badge variant="warning" className="text-xs gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {item._count.reports} report{item._count.reports > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.category}
                          {item._count.claims > 0 && ` · ${item._count.claims} claim${item._count.claims > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Reporter */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {item.user.image && (
                        <Image src={item.user.image} alt="" width={24} height={24} className="rounded-full" />
                      )}
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{item.user.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{item.user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {timeAgo(item.createdAt)}
                  </td>

                  {/* Status dropdown */}
                  <td className="px-4 py-3">
                    <Select
                      value={item.status}
                      onValueChange={(v) => updateStatus(item.id, v)}
                      disabled={updating === item.id}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/items/${item.id}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="View item">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Delete item"
                        onClick={() => deleteItem(item.id)}
                        disabled={updating === item.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParam('page', String(page + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
