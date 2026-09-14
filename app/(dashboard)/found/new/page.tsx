'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFoundItemSchema, CreateFoundItemInput, CATEGORIES } from '@/lib/validators/item';
import { uploadMultipleToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { extractTags } from '@/lib/utils';
import { CheckCircle, Upload, X, Loader2, MapPin, Eye, EyeOff, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const STEPS = ['Basic Info', 'Storage', 'Images', 'Review'];

export default function ReportFoundPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [autoTags, setAutoTags] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors }, trigger } = useForm<CreateFoundItemInput>({
    resolver: zodResolver(createFoundItemSchema),
    defaultValues: { images: [], tags: [], visibility: 'PUBLIC' },
  });

  const visibility = watch('visibility');

  function regenerateTags() {
    const title = getValues('title');
    const desc = getValues('description');
    const tags = extractTags(`${title || ''} ${desc || ''}`);
    setAutoTags(tags);
    setValue('tags', tags);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (!files.length) return;
    setUploading(true);
    try {
      const results = await uploadMultipleToCloudinary(files);
      const urls = results.map((r) => r.secure_url);
      setValue('images', [...(getValues('images') || []), ...urls].slice(0, 5));
      setPreviewImages((prev) => [...prev, ...urls].slice(0, 5));
      toast({ title: `${results.length} image(s) uploaded` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  async function nextStep() {
    let fields: (keyof CreateFoundItemInput)[] = [];
    if (step === 0) fields = ['title', 'description', 'category'];
    if (step === 1) fields = ['locationText', 'storageLocation'];
    const valid = await trigger(fields);
    if (valid) {
      if (step === 0) regenerateTags();
      setStep((s) => s + 1);
    }
  }

  const onError = (errors: any) => {
    console.error('Validation errors:', errors);
    const keys = Object.keys(errors);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const errorMsg = errors[firstKey]?.message || `Please check the "${firstKey}" field.`;
      toast({
        title: 'Please fix form errors',
        description: errorMsg,
        variant: 'destructive',
      });
      if (['title', 'description', 'category', 'color', 'brand', 'dateFound', 'visibility'].includes(firstKey)) {
        setStep(0);
      } else if (['locationText', 'storageLocation', 'handoverInstructions'].includes(firstKey)) {
        setStep(1);
      } else if (['images', 'tags'].includes(firstKey)) {
        setStep(2);
      }
    }
  };

  async function onSubmit(data: CreateFoundItemInput) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'FOUND', ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit');
      }
      const item = await res.json();
      toast({ title: '✅ Found item reported! Thank you for being a Good Samaritan.' });
      router.push(`/items/${item.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h1 className="font-heading text-3xl font-bold">Report Found Item</h1>
        </div>
        <p className="text-muted-foreground">
          Thank you for being a Good Samaritan! Help reunite this item with its owner.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer text-left"
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-green-100 text-green-700 border-2 border-green-500' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? 'font-medium' : 'text-muted-foreground'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)}>
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>What did you find?</CardTitle>
              <CardDescription>Describe the item you found as accurately as possible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Item title *</Label>
                <Input placeholder="e.g. Found Samsung Galaxy Watch, Black" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea placeholder="Describe what you found — color, condition, any distinctive marks. Do not include serial numbers or personal info that should be verified by the owner." rows={4} {...register('description')} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select onValueChange={(v) => setValue('category', v as any)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input placeholder="e.g. Black, Gold" {...register('color')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input placeholder="e.g. Samsung, Hidesign" {...register('brand')} />
                </div>
                <div className="space-y-2">
                  <Label>Date found</Label>
                  <Input type="date" {...register('dateFound')} />
                </div>
              </div>

              {/* Privacy toggle */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {visibility === 'PUBLIC' ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="font-medium text-sm">Visibility</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('visibility', visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                  >
                    {visibility === 'PUBLIC' ? '🌍 Public' : '🔒 Private (Admin only)'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {visibility === 'PUBLIC'
                    ? 'Anyone can see this listing. Good for most items.'
                    : 'Only admins can see this. Use for sensitive items like IDs, wallets with cash.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Location & Storage</CardTitle>
              <CardDescription>Where was it found and where is it now?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Where did you find it? *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea className="pl-9" placeholder="e.g. Devkiba College Canteen, near the main counter" rows={2} {...register('locationText')} />
                </div>
                {errors.locationText && <p className="text-sm text-destructive">{errors.locationText.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Where is it stored now? *</Label>
                <Textarea placeholder="e.g. Security Office, Admin Block, Devkiba College — open 9 AM to 5 PM" rows={2} {...register('storageLocation')} />
                {errors.storageLocation && <p className="text-sm text-destructive">{errors.storageLocation.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Handover instructions</Label>
                <Textarea placeholder="e.g. Bring your college ID. Ask for John at the front desk." rows={2} {...register('handoverInstructions')} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Photos (optional)</CardTitle>
              <CardDescription>Upload a photo to help the owner identify their item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin text-green-600" /> : (
                    <>
                      <Upload className="h-8 w-8" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs">Max 5 photos</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading || previewImages.length >= 5} />
              </label>

              {previewImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previewImages.map((url, i) => (
                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
                      <Image src={url} alt={`Upload ${i + 1}`} fill className="object-cover" />
                      <button type="button" onClick={() => {
                        setValue('images', getValues('images').filter((u) => u !== url));
                        setPreviewImages((p) => p.filter((u) => u !== url));
                      }} className="absolute top-1 right-1 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {autoTags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    Auto-tags <Badge variant="secondary" className="text-xs">AI</Badge>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {autoTags.map((t) => <span key={t} className="px-2 py-1 bg-muted rounded-md text-xs">#{t}</span>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Confirm the details before publishing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(errors).length > 0 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2 text-destructive">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>Please fix the following issues before submitting:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {Object.entries(errors).map(([field, err]: [string, any]) => (
                      <li key={field}>
                        <strong className="capitalize">{field}:</strong> {err?.message || 'Invalid value'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Title</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getValues('title') || '—'}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStep(0)}>Edit</Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Category</span>
                  <div className="flex items-center gap-2">
                    <span>{getValues('category') || '—'}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStep(0)}>Edit</Button>
                  </div>
                </div>
                {getValues('color') && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Color</span>
                    <span>{getValues('color')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Found at</span>
                  <div className="flex items-center gap-2">
                    <span className="text-right max-w-[200px] truncate">{getValues('locationText') || '—'}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStep(1)}>Edit</Button>
                  </div>
                </div>
                {getValues('storageLocation') && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Stored at</span>
                    <div className="flex items-center gap-2">
                      <span className="text-right max-w-[200px] truncate">{getValues('storageLocation')}</span>
                      <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStep(1)}>Edit</Button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Visibility</span>
                  <span>{getValues('visibility')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Photos</span>
                  <div className="flex items-center gap-2">
                    <span>{previewImages.length} uploaded</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStep(2)}>Edit</Button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                <strong>🎯 What happens next:</strong> Our AI will match your found item against all lost reports and notify both you and the owner if a match is found. Thank you for helping! 🙏
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between mt-4">
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="gap-2 bg-green-600 hover:bg-green-700 min-w-[170px]">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Found Report'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
