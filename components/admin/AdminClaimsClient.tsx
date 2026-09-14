'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { timeAgo, cn } from '@/lib/utils';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, User, Shield, Clock } from 'lucide-react';

interface Claim {
  id: string;
  status: string;
  description: string;
  proofText?: string | null;
  proofImages: string[];
  createdAt: string;
  adminNote?: string | null;
  claimant: { id: string; name?: string | null; email?: string | null; image?: string | null };
  item: {
    id: string; title: string; type: string; category: string;
    images: string[]; distinctiveFeatures?: string | null;
    user: { id: string; name?: string | null; email?: string | null };
  };
}

export function AdminClaimsClient({
  initialClaims,
  adminId,
}: {
  initialClaims: Claim[];
  adminId: string;
}) {
  const router = useRouter();
  const [claims, setClaims] = useState(initialClaims);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState('PENDING');

  const filteredClaims = filter === 'ALL'
    ? claims
    : claims.filter((c) => c.status === filter);

  const pendingCount = claims.filter((c) => c.status === 'PENDING').length;

  async function handleReview(claimId: string, status: 'APPROVED' | 'REJECTED') {
    setProcessing(claimId);
    try {
      const res = await fetch('/api/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          status,
          adminNote: adminNotes[claimId] || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update claim');
      }

      setClaims((prev) =>
        prev.map((c) => c.id === claimId
          ? { ...c, status, adminNote: adminNotes[claimId] || null }
          : c
        )
      );

      toast({
        title: status === 'APPROVED' ? '✅ Claim Approved' : '❌ Claim Rejected',
        description: `Claimant has been notified via email.`,
      });

      setExpandedId(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  }

  const statusVariant = (status: string) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'destructive';
    return 'warning';
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Review Claims</h1>
          {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
        </div>
        <p className="text-muted-foreground">Verify ownership and approve or reject claims.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              filter === f
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {f}
            {f === 'PENDING' && pendingCount > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Claims list */}
      {filteredClaims.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No {filter.toLowerCase()} claims.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <Card
              key={claim.id}
              className={cn(
                'overflow-hidden transition-shadow hover:shadow-md',
                claim.status === 'PENDING' && 'border-amber-200 dark:border-amber-800'
              )}
            >
              <CardContent className="p-0">
                {/* Collapsed header */}
                <button
                  className="w-full text-left p-4 flex items-center gap-4"
                  onClick={() => setExpandedId(expandedId === claim.id ? null : claim.id)}
                >
                  {/* Claimant avatar */}
                  {claim.claimant.image ? (
                    <Image
                      src={claim.claimant.image}
                      alt={claim.claimant.name || ''}
                      width={40}
                      height={40}
                      className="rounded-full shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{claim.claimant.name || 'Unknown'}</span>
                      <span className="text-muted-foreground text-sm">claims</span>
                      <Link
                        href={`/items/${claim.item.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-sm text-primary hover:underline truncate max-w-[200px]"
                      >
                        {claim.item.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{timeAgo(claim.createdAt)}</span>
                      <Badge variant={statusVariant(claim.status) as any} className="text-xs">
                        {claim.status}
                      </Badge>
                    </div>
                  </div>

                  {expandedId === claim.id
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                </button>

                {/* Expanded detail */}
                {expandedId === claim.id && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                    {/* Item + claimant side by side */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Item info */}
                      <div className="rounded-lg bg-background border p-3 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Item</p>
                        <p className="font-medium text-sm">{claim.item.title}</p>
                        <p className="text-xs text-muted-foreground">{claim.item.category}</p>
                        {claim.item.distinctiveFeatures && (
                          <div className="text-xs bg-amber-50 dark:bg-amber-950/20 rounded p-2">
                            <strong>Distinctive features:</strong> {claim.item.distinctiveFeatures}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Posted by: {claim.item.user.name} ({claim.item.user.email})
                        </p>
                      </div>

                      {/* Claimant info */}
                      <div className="rounded-lg bg-background border p-3 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Claimant</p>
                        <p className="font-medium text-sm">{claim.claimant.name}</p>
                        <p className="text-xs text-muted-foreground">{claim.claimant.email}</p>
                      </div>
                    </div>

                    {/* Claim description */}
                    <div className="rounded-lg bg-background border p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Ownership description
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{claim.description}</p>
                    </div>

                    {/* Proof text */}
                    {claim.proofText && (
                      <div className="rounded-lg bg-background border p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Additional proof</p>
                        <p className="text-sm">{claim.proofText}</p>
                      </div>
                    )}

                    {/* Proof images */}
                    {claim.proofImages.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Proof photos</p>
                        <div className="flex gap-2 flex-wrap">
                          {claim.proofImages.map((img, i) => (
                            <a key={img} href={img} target="_blank" rel="noopener noreferrer">
                              <Image
                                src={img}
                                alt={`Proof ${i + 1}`}
                                width={80}
                                height={80}
                                className="rounded-lg object-cover border hover:opacity-80 transition-opacity"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin note */}
                    {claim.status === 'PENDING' && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          Admin note (optional — sent to claimant)
                        </p>
                        <Textarea
                          placeholder="e.g. 'Claim approved — contact details revealed' or 'Rejected — proof insufficient'"
                          rows={2}
                          value={adminNotes[claim.id] || ''}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                        />
                      </div>
                    )}

                    {/* Already reviewed note */}
                    {claim.adminNote && (
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <strong>Admin note:</strong> {claim.adminNote}
                      </div>
                    )}

                    {/* Action buttons */}
                    {claim.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                          disabled={!!processing}
                          onClick={() => handleReview(claim.id, 'APPROVED')}
                        >
                          {processing === claim.id ? (
                            <span className="animate-spin">⟳</span>
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve Claim
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 gap-2"
                          disabled={!!processing}
                          onClick={() => handleReview(claim.id, 'REJECTED')}
                        >
                          {processing === claim.id ? (
                            <span className="animate-spin">⟳</span>
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
