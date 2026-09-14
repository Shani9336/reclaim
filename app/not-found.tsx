import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PackageSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <PackageSearch className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
        <h1 className="font-heading text-6xl font-bold text-primary mb-2">404</h1>
        <h2 className="font-heading text-2xl font-semibold mb-3">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          This page doesn&apos;t exist or the item may have been removed.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
          <Link href="/browse">
            <Button>Browse Items</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
