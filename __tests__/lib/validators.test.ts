import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLostItemSchema, createFoundItemSchema } from '@/lib/validators/item';

describe('createLostItemSchema', () => {
  it('validates a complete valid lost item', () => {
    const result = createLostItemSchema.safeParse({
      title: 'Black iPhone 15 Pro Max',
      description: 'Lost near the university canteen during lunch time. The phone has a blue case.',
      category: 'ELECTRONICS',
      color: 'black',
      brand: 'Apple',
      locationText: 'DY Patil University Canteen, Ground Floor',
      images: [],
      tags: ['iphone', 'apple', 'black'],
      visibility: 'PUBLIC',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createLostItemSchema.safeParse({
      title: '',
      description: 'Some description here',
      category: 'ELECTRONICS',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('title');
  });

  it('rejects title that is too short', () => {
    const result = createLostItemSchema.safeParse({
      title: 'AB',
      description: 'Some description that is long enough',
      category: 'ELECTRONICS',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description shorter than 5 chars', () => {
    const result = createLostItemSchema.safeParse({
      title: 'Valid Title',
      description: 'Tiny',
      category: 'ELECTRONICS',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('description');
  });

  it('allows relative image paths from local upload', () => {
    const result = createLostItemSchema.safeParse({
      title: 'Lost Backpack',
      description: 'Left in library 2nd floor',
      category: 'BAGS',
      images: ['/uploads/photo-1234.png'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = createLostItemSchema.safeParse({
      title: 'Valid Title',
      description: 'Valid description that is long enough to pass validation',
      category: 'INVALID_CATEGORY',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('category');
  });

  it('rejects too many images', () => {
    const result = createLostItemSchema.safeParse({
      title: 'Valid Title',
      description: 'Valid description that is long enough',
      category: 'ELECTRONICS',
      images: Array(6).fill('https://example.com/image.jpg'),
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be undefined', () => {
    const result = createLostItemSchema.safeParse({
      title: 'Lost Keys',
      description: 'Lost my house keys somewhere in the campus building near Block A',
      category: 'KEYS',
    });
    expect(result.success).toBe(true);
  });
});

describe('createFoundItemSchema', () => {
  it('validates a complete valid found item', () => {
    const result = createFoundItemSchema.safeParse({
      title: 'Found Black Wallet near Canteen',
      description: 'Found a black leather wallet near the university food court, it contains some cards.',
      category: 'WALLET',
      locationText: 'DY Patil University Food Court',
      storageLocation: 'Admin Office, Block A',
      images: [],
      tags: [],
      visibility: 'PUBLIC',
    });
    expect(result.success).toBe(true);
  });

  it('allows PRIVATE visibility', () => {
    const result = createFoundItemSchema.safeParse({
      title: 'Found sensitive document',
      description: 'Found a government ID card on the floor near the exit gate of the building.',
      category: 'DOCUMENTS',
      locationText: 'Exit gate, Block B',
      storageLocation: 'Security desk, Main Building',
      visibility: 'PRIVATE',
    });
    expect(result.success).toBe(true);
  });
});
