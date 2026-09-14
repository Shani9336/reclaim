'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import {
  Search, Menu, X, LogOut, User, Settings,
  LayoutDashboard, Moon, Sun, ShieldCheck
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggleTheme() {
    const current = resolvedTheme || theme || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  const navLinks = [
    { href: '/browse', label: 'Browse' },
    { href: '/lost/new', label: 'Post Lost' },
    { href: '/found/new', label: 'Post Found' },
    { href: '/matches', label: 'My Matches' },
    { href: '/map', label: 'Map' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm">
            <Search className="h-4 w-4 stroke-[2.5]" />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight hidden sm:block">
            Re<span className="text-red-500">Claim</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                pathname === link.href
                  ? 'bg-red-500/10 text-red-500 dark:bg-red-950/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={mounted && (resolvedTheme === 'dark') ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400 hover:text-amber-300 transition-colors" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700 hover:text-slate-900 transition-colors" />
              )
            ) : (
              <Sun className="h-4 w-4 opacity-50" />
            )}
          </Button>

          {session?.user ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <Link href="/profile">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-border"
                    />
                  </Link>
                ) : (
                  <Link href="/profile">
                    <div className="h-8 w-8 rounded-full bg-red-500/20 text-red-600 dark:text-red-300 flex items-center justify-center cursor-pointer font-bold text-xs ring-1 ring-red-300">
                      {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </Link>
                )}
                {['ADMIN', 'SUPER_ADMIN'].includes(session.user.role) && (
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden md:flex gap-1 text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login?callbackUrl=/admin">
                <Button variant="ghost" size="sm" className="text-xs font-semibold">Staff Portal</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="text-xs font-semibold rounded-full px-4 bg-red-500 hover:bg-red-600 text-white">
                  User Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-2">
          {session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role) && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/40"
              onClick={() => setMobileOpen(false)}
            >
              <ShieldCheck className="h-4 w-4 text-red-500" /> Admin Portal
            </Link>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground w-full rounded-md hover:bg-muted"
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" /> Switch to Light Mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700" /> Switch to Dark Mode
              </>
            )}
          </button>
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground w-full"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
