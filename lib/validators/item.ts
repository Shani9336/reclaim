import { z } from 'zod';

export const CATEGORIES = [
  'ELECTRONICS',
  'DOCUMENTS',
  'WALLET',
  'KEYS',
  'BAGS',
  'JEWELRY',
  'CLOTHING',
  'OTHER',
] as const;

export const ITEM_STATUSES = [
  'OPEN',
  'CLAIMED',
  'VERIFIED',
  'RETURNED',
  'CLOSED',
] as const;

const optionalString = z.string().optional().nullable().or(z.literal(''));

export const createLostItemSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters'),
  description: z
    .string()
    .min(5, 'Please provide at least 5 characters of description')
    .max(2000, 'Description too long'),
  category: z.enum(CATEGORIES, { required_error: 'Please select a category' }),
  color: optionalString,
  brand: optionalString,
  dateLost: optionalString,
  timeLost: optionalString,
  locationText: z
    .string()
    .max(200, 'Location description too long')
    .optional()
    .nullable()
    .or(z.literal('')),
  locationLat: z.number().min(-90).max(90).optional().nullable(),
  locationLng: z.number().min(-180).max(180).optional().nullable(),
  images: z.array(z.string()).max(5, 'Maximum 5 images').default([]),
  distinctiveFeatures: optionalString,
  reward: optionalString,
  spaceId: optionalString,
  tags: z.array(z.string()).max(20).default([]),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
});

export const createFoundItemSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters'),
  description: z
    .string()
    .min(5, 'Please provide at least 5 characters of description')
    .max(2000, 'Description too long'),
  category: z.enum(CATEGORIES, { required_error: 'Please select a category' }),
  color: optionalString,
  brand: optionalString,
  dateFound: optionalString,
  locationText: z
    .string()
    .max(200, 'Location description too long')
    .optional()
    .nullable()
    .or(z.literal('')),
  locationLat: z.number().min(-90).max(90).optional().nullable(),
  locationLng: z.number().min(-180).max(180).optional().nullable(),
  images: z.array(z.string()).max(5, 'Maximum 5 images').default([]),
  storageLocation: optionalString,
  handoverInstructions: optionalString,
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  spaceId: optionalString,
  tags: z.array(z.string()).max(20).default([]),
});

export const itemFilterSchema = z.object({
  type: z.enum(['LOST', 'FOUND', 'ALL']).default('ALL'),
  category: z.enum([...CATEGORIES, 'ALL']).default('ALL'),
  status: z.enum([...ITEM_STATUSES, 'ALL']).default('ALL'),
  search: z.string().max(200).optional(),
  color: z.string().max(50).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  spaceId: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export type CreateLostItemInput = z.infer<typeof createLostItemSchema>;
export type CreateFoundItemInput = z.infer<typeof createFoundItemSchema>;
export type ItemFilterInput = z.infer<typeof itemFilterSchema>;
