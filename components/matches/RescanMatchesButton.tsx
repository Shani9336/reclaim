'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export function RescanMatchesButton() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  async function handleRescan() {
    setScanning(true);
    try {
      const res = await fetch('/api/matches/scan', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to scan matches');
      const data = await res.json();
      toast({
        title: '✅ AI Matching Scan Complete',
        description: data.message || `Scanned items and synced matches!`,
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Scan Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRescan}
      disabled={scanning}
      className="gap-2"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
      {scanning ? 'Scanning AI Matches...' : 'Re-scan Matches'}
    </Button>
  );
}
