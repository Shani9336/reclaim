import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { FeedbackSection } from '@/components/landing/FeedbackSection';
import { timeAgo } from '@/lib/utils';
import {
  Search, MapPin, ArrowRight, Shield, CheckCircle,
  AlertCircle, Sparkles, User, LogIn
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Keys', icon: '🗝️', category: 'KEYS' },
  { name: 'Wallet', icon: '👛', category: 'WALLET' },
  { name: 'Phone', icon: '📱', category: 'ELECTRONICS' },
  { name: 'Laptop', icon: '💻', category: 'ELECTRONICS' },
  { name: 'Earbuds', icon: '🎧', category: 'ELECTRONICS' },
  { name: 'Bottle', icon: '🍶', category: 'OTHER' },
  { name: 'Backpack', icon: '🎒', category: 'BAGS' },
  { name: 'Hoodie', icon: '🧥', category: 'CLOTHING' },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // Fetch real latest items from the database
  const latestItems = await prisma.item.findMany({
    where: { status: 'OPEN', visibility: 'PUBLIC' },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      space: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-red-500/20">
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-16 pb-14 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top campus pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 text-xs font-medium text-red-600 dark:text-red-300 shadow-sm">
            <span>🎓</span>
            <span>Devkiba College, Silvassa</span>
          </div>

          {/* Main Title */}
          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Lost something? <br />
            <span className="text-red-500">We&apos;ll help you find it.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
            ReClaim connects students and members who&apos;ve lost items with those who&apos;ve
            found them — all on campus & community, all in one place.
          </p>

          {/* 3 Call-To-Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/browse">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6 bg-red-50/50 dark:bg-muted/40 border-red-100 dark:border-border hover:bg-red-100/50 dark:hover:bg-muted text-foreground font-medium"
              >
                Browse Items
              </Button>
            </Link>

            <Link href="/lost/new">
              <Button
                size="lg"
                className="rounded-full px-7 bg-red-500 hover:bg-red-600 text-white font-medium shadow-sm transition-all"
              >
                Post Lost
              </Button>
            </Link>

            <Link href="/found/new">
              <Button
                size="lg"
                className="rounded-full px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
              >
                Post Found
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Common Categories Bar */}
      <section className="py-8 border-y bg-muted/20">
        <div className="container max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Common categories
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/browse?category=${cat.category}`}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all group cursor-pointer"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </span>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reports Section */}
      <section className="py-14">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
                Latest reports
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Recently reported lost and found items in our area
              </p>
            </div>
            <Link
              href="/browse"
              className="text-xs sm:text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestItems.map((item) => {
              const isFound = item.type === 'FOUND';
              const thumbnail = item.images?.[0];

              return (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="group rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  {/* Image container */}
                  <div className="relative aspect-[4/3] bg-muted/60 overflow-hidden">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted/50 to-muted">
                        {item.category === 'ELECTRONICS' && '📱'}
                        {item.category === 'WALLET' && '👛'}
                        {item.category === 'KEYS' && '🗝️'}
                        {item.category === 'BAGS' && '🎒'}
                        {item.category === 'DOCUMENTS' && '📄'}
                        {item.category === 'CLOTHING' && '🧥'}
                        {item.category === 'JEWELRY' && '💍'}
                        {item.category === 'OTHER' && '📦'}
                      </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                          isFound
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {item.category.toLowerCase()}
                      </p>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        <span className="truncate">{item.locationText || item.space?.name || 'Campus'}</span>
                      </span>
                      <span className="shrink-0">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-14 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="rounded-3xl border bg-card p-8 sm:p-10 shadow-sm text-center">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-8">
              How it works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3 flex flex-col items-center">
                <div className="text-4xl">📝</div>
                <h3 className="font-semibold text-base">Post a report</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Log your lost or found item in under 60 seconds with photos and details.
                </p>
              </div>

              <div className="space-y-3 flex flex-col items-center">
                <div className="text-4xl">🔔</div>
                <h3 className="font-semibold text-base">Get matched</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Browse open reports and our built-in smart AI automatically matches what&apos;s yours.
                </p>
              </div>

              <div className="space-y-3 flex flex-col items-center">
                <div className="text-4xl">🤝</div>
                <h3 className="font-semibold text-base">Reconnect</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Arrange a safe verified handoff, verify ownership, and mark it resolved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback & Contact Section */}
      <FeedbackSection />

      {/* Footer */}
      <footer className="border-t bg-card py-12 mt-auto text-xs text-muted-foreground">
        <div className="container max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="h-6 w-6 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-xs">
                R
              </div>
              <span className="font-heading font-bold text-sm text-foreground">ReClaim</span>
            </div>
            <p className="max-w-md">
              Helping students and community members reconnect with lost things. Because everything lost deserves a second chance. 💙
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-foreground">
            <Link href="/browse" className="hover:text-red-500 transition-colors">Browse</Link>
            <Link href="/lost/new" className="hover:text-red-500 transition-colors">Post Lost</Link>
            <Link href="/found/new" className="hover:text-red-500 transition-colors">Post Found</Link>
            <Link href="/matches" className="hover:text-red-500 transition-colors">My Matches</Link>
            <Link href="/map" className="hover:text-red-500 transition-colors">Map</Link>
            <Link href="/admin" className="hover:text-red-500 transition-colors">Admin Portal</Link>
          </div>
        </div>

        <div className="container max-w-6xl mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© 2026 ReClaim — Semester 5 Community Engagement Project.</p>
          <div className="flex items-center gap-2 text-xs">
            <span>Built with ❤️ for Devkiba College</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
