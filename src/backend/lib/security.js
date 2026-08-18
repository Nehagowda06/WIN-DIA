import { NextResponse } from "next/server";

// Ported from windia-integrated-version3-main/src/lib/security.js
// Change: replaced NextResponse.json() with plain objects — Express routes
//         call res.status().json() themselves using these return values.

/** Strips malicious markup from plain-text fields before storing them. */
export function sanitizeText(input, maxLength = 1000) {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeObject(obj, maxLength = 1000) {
  if (!obj || typeof obj !== "object") return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") out[key] = sanitizeText(value, maxLength);
    else if (value && typeof value === "object") out[key] = sanitizeObject(value, maxLength);
    else out[key] = value;
  }
  return out;
}

/** Standard error payload — route handler sends it with res.status(status).json() */
export function errorPayload(message, status = 400, extra = {}) {
  return { payload: { success: false, error: message, ...extra }, status };
}

/** Standard success payload */
export function successPayload(data = {}, status = 200) {
  return { payload: { success: true, ...data }, status };
}


/** Next.js App Router version — wraps errorPayload in a NextResponse. */
export function errorResponse(message, status = 400, extra = {}) {
  const { payload } = errorPayload(message, status, extra);
  return NextResponse.json(payload, { status });
}

/** Next.js App Router version — wraps successPayload in a NextResponse. */
export function successResponse(data = {}, status = 200) {
  const { payload } = successPayload(data, status);
  return NextResponse.json(payload, { status });
}

/**
 * Verifies the Authorization: Bearer <token> header against Supabase
 * and returns the user, or null if not authenticated.
 */
export async function getAuthedUser(req, supabaseClient) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

/** Checks the authed user's role in `profiles`. Requires the service-role client. */
export async function isAdmin(userId, supabaseAdminClient) {
  if (!userId) return false;
  const { data, error } = await supabaseAdminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data) return false;
  return data.role === "admin";
}

/** Extracts the real client IP from proxy headers. */
export function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}
