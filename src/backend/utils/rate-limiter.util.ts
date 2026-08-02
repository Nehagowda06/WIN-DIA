import { NextResponse } from 'next/server';
import { createErrorResponse } from '../types/api-response.types';
import { getAdminClient } from '../config/supabase.config';
import { logger } from './logger.util';

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

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Serverless & Multi-Instance Rate Limiter backed by Supabase / PostgreSQL
 * Zero in-memory Maps, zero process state. Safe across all Vercel Serverless instances.
 */
export async function checkDatabaseRateLimit(
  key: string,
  route: string,
  maxRequests: number = 5,
  windowSeconds: number = 60
): Promise<RateLimitCheckResult> {
  try {
    const client = getAdminClient();
    const { data, error } = await client.rpc('check_and_increment_rate_limit', {
      p_key: key,
      p_route: route,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (!error && data && data.length > 0) {
      const row = data[0];
      return {
        allowed: Boolean(row.allowed),
        remaining: Number(row.remaining),
        resetSeconds: Number(row.reset_seconds),
      };
    }

    // Fallback if RPC function is not installed: direct PostgreSQL upsert query
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000).toISOString();

    const { data: existing } = await client
      .from('rate_limits')
      .select('id, request_count, expires_at')
      .eq('key', key)
      .eq('route', route)
      .maybeSingle();

    if (!existing || new Date(existing.expires_at) <= now) {
      await client.from('rate_limits').upsert(
        {
          key,
          route,
          request_count: 1,
          window_start: now.toISOString(),
          expires_at: expiresAt,
          updated_at: now.toISOString(),
        },
        { onConflict: 'key,route' }
      );
      return { allowed: true, remaining: maxRequests - 1, resetSeconds: windowSeconds };
    }

    const currentCount = existing.request_count + 1;
    const isAllowed = currentCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - currentCount);
    const resetSec = Math.max(0, Math.ceil((new Date(existing.expires_at).getTime() - now.getTime()) / 1000));

    await client
      .from('rate_limits')
      .update({
        request_count: currentCount,
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id);

    return {
      allowed: isAllowed,
      remaining,
      resetSeconds: resetSec,
    };
  } catch (err) {
    logger.warn('[RateLimiter] Database rate limit evaluation failed, failing open for resilience', { error: err });
    return { allowed: true, remaining: maxRequests - 1, resetSeconds: windowSeconds };
  }
}

/**
 * Applies database-backed rate limit for Next.js Route Handlers.
 * Returns NextResponse with 429 status and headers if limit is exceeded, or null if allowed.
 */
export async function applyRateLimit(
  request: Request,
  actionName: string,
  maxRequests: number = 5,
  windowSeconds: number = 60
): Promise<NextResponse | null> {
  const ip = extractClientIp(request);
  const result = await checkDatabaseRateLimit(ip, actionName, maxRequests, windowSeconds);

  if (!result.allowed) {
    return NextResponse.json(
      createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        `Too many attempts. Please try again in ${result.resetSeconds} seconds.`
      ),
      {
        status: 429,
        headers: {
          'Retry-After': String(result.resetSeconds),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      }
    );
  }

  return null;
}
