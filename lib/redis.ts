import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Upstash Redis credentials are valid and provided
const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_URL.startsWith('http')
);

export const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Creates a rate limiter instance if Redis is configured,
 * otherwise returns a safe no-op pass-through for local development.
 */
function createLimiter(limit: number, windowStr: '1 h' | '1 m' | '15 m', prefix: string) {
  if (redis) {
    try {
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, windowStr),
        analytics: true,
        prefix,
      });
    } catch {
      // Fallback if Redis fails to initialize
    }
  }

  // Graceful no-op fallback when Upstash is not configured
  return {
    limit: async (_identifier?: string) => ({
      success: true,
      limit,
      remaining: limit - 1,
      reset: Date.now() + 60000,
    }),
  };
}

// Item report: max 10 new items per hour per IP
export const itemReportLimiter = createLimiter(10, '1 h', 'rl:item_report');

// Search: max 100 searches per minute per IP
export const searchLimiter = createLimiter(100, '1 m', 'rl:search');

// Auth: max 5 login attempts per 15 minutes per IP
export const authLimiter = createLimiter(5, '15 m', 'rl:auth');

// Claims: max 3 claims per hour per user
export const claimLimiter = createLimiter(3, '1 h', 'rl:claim');
