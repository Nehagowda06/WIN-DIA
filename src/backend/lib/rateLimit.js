// Ported from windia-integrated-version3-main/src/lib/rateLimit.js
// Change: req.headers access uses plain Node/Express style (headers object,
//         not .get()) — getClientIp is now in security.js, kept here too
//         for backward compat.

/**
 * Simple in-memory sliding-window rate limiter.
 * Works on a single long-running Express server.
 */
const buckets = new Map();

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (now - entry.windowStart > 60 * 60 * 1000) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - entry.windowStart),
    };
  }
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}
