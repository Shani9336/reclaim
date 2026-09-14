'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLostItemSchema, CreateLostItemInput, CATEGORIES } from '@/lib/validators/item';
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
import { AlertCircle, Upload, X, Loader2, MapPin, Tag, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const STEPS = ['Basic Info', 'Location', 'Images', 'Review'];

export default function ReportLostPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [autoTags, setAutoTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
    trigger,
  } = useForm<CreateLostItemInput>({
    resolver: zodResolver(createLostItemSchema),
    defaultValues: { images: [], tags: [], visibility: 'PUBLIC' },
  });

  // Auto-generate tags as user types
  const description = watch('description');
  const title = watch('title');

  function regenerateTags() {
    const tags = extractTags(`${title || ''} ${description || ''}`);
    setAutoTags(tags);
    setValue('tags', tags);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const results = await uploadMultipleToCloudinary(files);
      const urls = results.map((r) => r.secure_url);
      setValue('images', [...(getValues('images') || []), ...urls].slice(0, 5));
      setPreviewImages((prev) => [...prev, ...urls].slice(0, 5));
      toast({ title: `${results.length} image${results.length > 1 ? 's' : ''} uploaded` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    const current = getValues('images') || [];
    setValue('images', current.filter((u) => u !== url));
    setPreviewImages((prev) => prev.filter((u) => u !== url));
  }

  async function onSubmit(data: CreateLostItemInput) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'LOST', ...data }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit');
      }

      const item = await res.json();
      toast({
        title: '✅ Lost item reported!',
        description: 'We will notify you when a match is found.',
      });
      router.push(`/items/${item.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
      if (['title', 'description', 'category', 'color', 'brand', 'dateLost', 'reward', 'distinctiveFeatures'].includes(firstKey)) {
        setStep(0);
      } else if (['locationText', 'timeLost'].includes(firstKey)) {
        setStep(1);
      } else if (['images', 'tags'].includes(firstKey)) {
        setStep(2);
      }
    }
  };

  async function nextStep() {
    let fieldsToValidate: (keyof CreateLostItemInput)[] = [];
    if (step === 0) fieldsToValidate = ['title', 'description', 'category'];
    if (step === 1) fieldsToValidate = ['locationText'];
    const valid = await trigger(fieldsToValidate);
    if (valid) {
      if (step === 0) regenerateTags();
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <h1 className="font-heading text-3xl font-bold">Report Lost Item</h1>
        </div>
        <p className="text-muted-foreground">
          Fill in the details below. The more information you provide, the better our matching engine can find your item.
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
              i < step ? 'bg-primary text-primary-foreground' :
              i === step ? 'bg-primary/20 text-primary border-2 border-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Describe what you lost as clearly as possible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Item title *</Label>
                <Input id="title" placeholder="e.g. Black iPhone 15 Pro Max" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the item in detail — color, size, distinguishing marks, contents, etc."
                  rows={4}
                  {...register('description')}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select onValueChange={(v) => setValue('category', v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" placeholder="e.g. Black, Dark Blue" {...register('color')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand / Make</Label>
                  <Input id="brand" placeholder="e.g. Apple, Samsung" {...register('brand')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateLost">Date lost</Label>
                  <Input id="dateLost" type="date" {...register('dateLost')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="distinctiveFeatures">Distinctive features</Label>
                <Textarea
                  id="distinctiveFeatures"
                  placeholder="Scratches, stickers, engravings, contents — anything unique that helps verify ownership."
                  rows={2}
                  {...register('distinctiveFeatures')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Reward (optional)</Label>
                <Input id="reward" placeholder="e.g. ₹500 reward offered" {...register('reward')} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Where did you last have the item?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locationText">Location description *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="locationText"
                    className="pl-9"
                    placeholder="e.g. Devkiba College Canteen, Ground Floor, near the cash counter"
                    rows={2}
                    {...register('locationText')}
                  />
                </div>
                {errors.locationText && <p className="text-sm text-destructive">{errors.locationText.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeLost">Approximate time</Label>
                  <Input id="timeLost" placeholder="e.g. 2:00 PM - 4:00 PM" {...register('timeLost')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateLost">Date</Label>
                  <Input id="dateLost2" type="date" {...register('dateLost')} />
                </div>
              </div>

              <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Interactive map picker</p>
                <p className="text-xs mt-1">Click on the map to pin the exact location</p>
                <p className="text-xs mt-2 text-amber-600">
                  💡 Map requires Leaflet (enabled in production). Use description above for now.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Images */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Upload up to 5 photos of the item (optional but highly recommended).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload zone */}
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8" />
                      <p className="text-sm font-medium">Click to upload photos</p>
                      <p className="text-xs">PNG, JPG, WEBP up to 10MB each · Max 5 photos</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading || previewImages.length >= 5}
                />
              </label>

              {/* Preview grid */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previewImages.map((url, i) => (
                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
                      <Image src={url} alt={`Upload ${i + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-tags */}
              {autoTags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Auto-generated tags</span>
                    <Badge variant="secondary" className="text-xs">AI-powered</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {autoTags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-muted rounded-md text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These tags are automatically extracted from your description to improve matching.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Review your report before submitting.</CardDescription>
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
                  <span className="text-muted-foreground">Location</span>
                  <div className="flex items-center gap-2">
                    <span className="text-right max-w-[200px] truncate">{getValues('locationText') || '—'}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStep(1)}>Edit</Button>
                  </div>
                </div>
                {getValues('reward') && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Reward</span>
                    <span className="text-amber-600 font-medium">{getValues('reward')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Photos</span>
                  <div className="flex items-center gap-2">
                    <span>{previewImages.length} uploaded</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStep(2)}>Edit</Button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <strong>🎯 What happens next:</strong> Our AI matching engine will scan all found items and notify you instantly if we find a match above 70% similarity. You can also browse the found items yourself.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="gap-2 min-w-[150px]">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
