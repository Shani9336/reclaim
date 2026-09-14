'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  Search, MapPin, AlertCircle, CheckCircle,
  User, Bell, LayoutDashboard, PlusCircle, Sun, Moon, Users
} from 'lucide-react';
import { useTheme } from 'next-themes';

const navItems = [
  { href: '/browse', label: 'Browse All', icon: Search },
  { href: '/map', label: 'Map View', icon: MapPin },
  { href: '/lost/new', label: 'Report Lost', icon: AlertCircle },
  { href: '/found/new', label: 'Report Found', icon: CheckCircle },
  { href: '/matches', label: 'My Matches', icon: Bell },
  { href: '/claims', label: 'My Claims', icon: PlusCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'User Roles', icon: Users },
  { href: '/admin/items', label: 'Moderate Items', icon: Search },
  { href: '/admin/claims', label: 'Review Claims', icon: CheckCircle },
  { href: '/admin/spaces', label: 'Spaces', icon: MapPin },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="space-y-1 sticky top-24">
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Main
        </p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-6">
              Admin
            </p>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}

        {/* Theme switcher */}
        <div className="pt-4 mt-4 border-t">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700 shrink-0" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </nav>
    </aside>
  );
}
