import { z } from 'zod';

export const createClaimSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  description: z
    .string()
    .min(5, 'Please provide at least 5 characters describing how this is your item')
    .max(2000),
  proofText: z
    .string()
    .max(1000)
    .optional()
    .nullable()
    .or(z.literal(''))
    .describe('Serial number, bill details, or other unique identifiers'),
  proofImages: z
    .array(z.string())
    .max(3, 'Maximum 3 proof images')
    .default([]),
});

export const reviewClaimSchema = z.object({
  claimId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNote: z.string().max(500).optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>;
