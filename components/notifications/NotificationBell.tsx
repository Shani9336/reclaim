'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      return res.json();
    },
    refetchInterval: 30000, // poll every 30s
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unread = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  const getNotifIcon = (type: string) => {
    if (type === 'MATCH_FOUND') return '🎯';
    if (type === 'CLAIM_APPROVED') return '✅';
    if (type === 'CLAIM_REJECTED') return '❌';
    if (type === 'CLAIM_SUBMITTED') return '📋';
    return '🔔';
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications ${unread > 0 ? `(${unread} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 h-7"
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link || '#'}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0',
                    !notif.read && 'bg-primary/5'
                  )}
                >
                  <span className="text-lg shrink-0 mt-0.5">{getNotifIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium line-clamp-1', !notif.read && 'text-foreground')}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
