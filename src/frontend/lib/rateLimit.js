const buckets = new Map();
setInterval(() => { const now = Date.now(); for (const [k, e] of buckets) if (now - e.windowStart > 3600000) buckets.delete(k); }, 600000).unref?.();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now(), entry = buckets.get(key);
  if (!entry || now - entry.windowStart > windowMs) { buckets.set(key, { count: 1, windowStart: now }); return { allowed: true }; }
  if (entry.count >= limit) return { allowed: false };
  entry.count++;
  return { allowed: true };
}

export function getClientIp(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
