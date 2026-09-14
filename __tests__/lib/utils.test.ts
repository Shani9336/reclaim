import { describe, it, expect } from 'vitest';
import {
  formatDate,
  timeAgo,
  scoreToPercent,
  getScoreColor,
  getStatusClass,
  truncate,
  getInitials,
  extractTags,
  formatINR,
} from '@/lib/utils';

describe('formatDate', () => {
  it('formats a date string correctly', () => {
    expect(formatDate('2024-09-10')).toBe('Sep 10, 2024');
  });

  it('formats a Date object', () => {
    expect(formatDate(new Date('2024-01-15'))).toMatch(/Jan 15, 2024/);
  });
});

describe('scoreToPercent', () => {
  it('converts 0.94 to 94%', () => {
    expect(scoreToPercent(0.94)).toBe('94%');
  });

  it('converts 1.0 to 100%', () => {
    expect(scoreToPercent(1.0)).toBe('100%');
  });

  it('rounds correctly', () => {
    expect(scoreToPercent(0.876)).toBe('88%');
  });
});

describe('getScoreColor', () => {
  it('returns green for score >= 0.8', () => {
    expect(getScoreColor(0.9)).toContain('green');
    expect(getScoreColor(0.8)).toContain('green');
  });

  it('returns amber for 0.6 <= score < 0.8', () => {
    expect(getScoreColor(0.7)).toContain('amber');
    expect(getScoreColor(0.6)).toContain('amber');
  });

  it('returns red for score < 0.6', () => {
    expect(getScoreColor(0.5)).toContain('red');
    expect(getScoreColor(0.1)).toContain('red');
  });
});

describe('getStatusClass', () => {
  it('returns correct class for OPEN', () => {
    expect(getStatusClass('OPEN')).toBe('status-open');
  });

  it('returns correct class for RETURNED', () => {
    expect(getStatusClass('RETURNED')).toBe('status-returned');
  });

  it('returns fallback for unknown status', () => {
    expect(getStatusClass('UNKNOWN')).toBe('bg-gray-100 text-gray-600');
  });
});

describe('truncate', () => {
  it('does not truncate short text', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates long text with ellipsis', () => {
    const result = truncate('Hello World this is a long sentence', 10);
    expect(result).toBe('Hello Worl...');
    expect(result.length).toBe(13);
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('Alice Kumar')).toBe('AK');
  });

  it('handles single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns max 2 characters', () => {
    expect(getInitials('Alice Bob Carol')).toBe('AB');
  });

  it('returns uppercase', () => {
    expect(getInitials('alice kumar')).toBe('AK');
  });
});

describe('extractTags', () => {
  it('extracts meaningful words', () => {
    const tags = extractTags('Black iPhone 15 Pro Max lost near university canteen');
    expect(tags).toContain('black');
    expect(tags).toContain('iphone');
    expect(tags).toContain('university');
    expect(tags).toContain('canteen');
  });

  it('filters out stop words', () => {
    const tags = extractTags('I lost my phone near the library');
    expect(tags).not.toContain('the');
    expect(tags).not.toContain('my');
    expect(tags).not.toContain('near');
    expect(tags).not.toContain('lost');
  });

  it('filters out short words', () => {
    const tags = extractTags('I lost it');
    tags.forEach((tag) => expect(tag.length).toBeGreaterThan(2));
  });

  it('limits to 15 tags maximum', () => {
    const longText = Array.from({ length: 50 }, (_, i) => `word${i}keywords`).join(' ');
    const tags = extractTags(longText);
    expect(tags.length).toBeLessThanOrEqual(15);
  });

  it('returns lowercase tags', () => {
    const tags = extractTags('BLACK IPHONE APPLE');
    tags.forEach((tag) => expect(tag).toBe(tag.toLowerCase()));
  });
});

describe('formatINR', () => {
  it('formats a number as Indian Rupees', () => {
    const result = formatINR(2000);
    expect(result).toContain('2,000');
    expect(result).toContain('₹');
  });

  it('handles zero', () => {
    const result = formatINR(0);
    expect(result).toContain('0');
  });
});
