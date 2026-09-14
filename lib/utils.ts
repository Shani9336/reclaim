import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date as "Sep 10, 2024" */
export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

/** Format as relative time, e.g. "3 days ago" */
export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Convert match score (0–1) to percentage string */
export function scoreToPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/** Get Tailwind color class based on match score */
export function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600 dark:text-green-400';
  if (score >= 0.6) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

/** Get status badge CSS class */
export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'status-open',
    CLAIMED: 'status-claimed',
    VERIFIED: 'status-verified',
    RETURNED: 'status-returned',
    CLOSED: 'status-closed',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/** Generate initials from a name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Extract keywords from text for auto-tagging */
export function extractTags(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
    'for', 'of', 'with', 'by', 'from', 'my', 'i', 'was', 'it', 'is',
    'has', 'have', 'had', 'been', 'be', 'are', 'this', 'that', 'its',
    'near', 'last', 'some', 'around', 'about', 'lost', 'found',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 15);
}

/** Format currency in Indian Rupees */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Get an IP address from request headers (for rate limiting) */
export function getIpFromHeaders(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}
