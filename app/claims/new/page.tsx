'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClaimSchema, CreateClaimInput } from '@/lib/validators/claim';
import { uploadMultipleToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Shield, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

function NewClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemId = searchParams.get('itemId');

  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      if (!itemId) return null;
      const res = await fetch(`/api/items/${itemId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!itemId,
  });

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<CreateClaimInput>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: { itemId: itemId || '', proofImages: [] },
  });

  useEffect(() => {
    if (itemId) {
      setValue('itemId', itemId);
    }
  }, [itemId, setValue]);

  const onError = (errors: any) => {
    console.error('Claim validation errors:', errors);
    const keys = Object.keys(errors);
    if (keys.length > 0) {
      toast({
        title: 'Please fix claim errors',
        description: errors[keys[0]]?.message || 'Check the required fields',
        variant: 'destructive',
      });
    }
  };

  if (!itemId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-xl text-center py-16">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold mb-2">No item selected</h2>
          <p className="text-muted-foreground mb-4">Please select an item to claim from the browse page.</p>
          <Link href="/browse"><Button>Browse Items</Button></Link>
        </div>
      </div>
    );
  }

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    if (!files.length) return;
    setUploading(true);
    try {
      const results = await uploadMultipleToCloudinary(files);
      const urls = results.map((r) => r.secure_url);
      setValue('proofImages', [...(getValues('proofImages') || []), ...urls].slice(0, 3));
      setProofPreviews((prev) => [...prev, ...urls].slice(0, 3));
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: CreateClaimInput) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit claim');
      }
      toast({
        title: '📋 Claim submitted!',
        description: 'An admin will review your claim and contact you shortly.',
      });
      router.push('/claims');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Submit a Claim</h1>
        </div>

      {/* Item preview */}
      {item && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex gap-3 items-center">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                {item.type === 'LOST' ? '🔍' : '✅'}
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.category} · {item.locationText}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Prove Ownership</CardTitle>
            <CardDescription>
              Describe how you know this is your item. Include details only the true owner would know —
              serial numbers, contents, distinctive marks, purchase receipts, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Description of ownership *</Label>
              <Textarea
                placeholder="Explain in detail why this is your item. For example: 'The phone has a cracked screen protector and the wallpaper is a photo of my golden retriever named Bruno. My phone number is registered to this device. The case has my college name engraved.'"
                rows={5}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 50 characters. Be as specific as possible.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Additional proof (optional)</Label>
              <Textarea
                placeholder="Serial number, purchase order number, bill details, or any unique identifier..."
                rows={2}
                {...register('proofText')}
              />
            </div>

            {/* Proof image upload */}
            <div className="space-y-2">
              <Label>Proof photos (optional, max 3)</Label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      <p className="text-sm">Upload receipt, bill, or ID</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleProofUpload} disabled={uploading || proofPreviews.length >= 3} />
              </label>

              {proofPreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {proofPreviews.map((url, i) => (
                    <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden group">
                      <Image src={url} alt={`Proof ${i + 1}`} fill className="object-cover" />
                      <button type="button" onClick={() => {
                        setValue('proofImages', getValues('proofImages').filter((u) => u !== url));
                        setProofPreviews((p) => p.filter((u) => u !== url));
                      }} className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 text-sm space-y-1">
          <p className="font-medium text-amber-800 dark:text-amber-400">⚠️ Important</p>
          <p className="text-amber-700 dark:text-amber-300">
            False claims are a violation of our Terms of Service and may result in account suspension.
            An admin will verify your claim before releasing any contact information.
          </p>
        </div>

        <Button type="submit" disabled={submitting || itemLoading} className="w-full gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Submit Claim
        </Button>
      </form>
    </div>
  </div>
  );
}

export default function NewClaimPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <NewClaimContent />
    </Suspense>
  );
}
