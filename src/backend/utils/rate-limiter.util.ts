import { NextResponse } from 'next/server';
import { createErrorResponse } from '../types/api-response.types';

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export function extractClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, resetMs: windowMs };
  }

  if (bucket.count >= maxRequests) {
    const resetMs = Math.max(0, windowMs - (now - bucket.windowStart));
    return { allowed: false, remaining: 0, resetMs };
  }

  bucket.count += 1;
  const remaining = Math.max(0, maxRequests - bucket.count);
  const resetMs = Math.max(0, windowMs - (now - bucket.windowStart));
  return { allowed: true, remaining, resetMs };
}

export function applyRateLimit(
  request: Request,
  actionName: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): NextResponse | null {
  const ip = extractClientIp(request);
  const limitKey = `rate_limit:${actionName}:${ip}`;
  const result = checkRateLimit(limitKey, maxRequests, windowMs);

  if (!result.allowed) {
    const retrySeconds = Math.ceil(result.resetMs / 1000);
    return NextResponse.json(
      createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        `Too many attempts. Please try again in ${retrySeconds} seconds.`
      ),
      {
        status: 429,
        headers: {
          'Retry-After': String(retrySeconds),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      }
    );
  }

  return null;
}
