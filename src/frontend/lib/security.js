import { NextResponse } from "next/server";

export function sanitizeObject(obj, maxLength = 1000) {
  if (!obj || typeof obj !== "object") return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out[k] = v.replace(/<[^>]*>/g, "").trim().slice(0, maxLength);
    else if (v && typeof v === "object") out[k] = sanitizeObject(v, maxLength);
    else out[k] = v;
  }
  return out;
}

export function errorResponse(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

export function successResponse(data = {}, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export async function getAuthedUser(req, supabaseClient) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) return null;
  const { data, error } = await supabaseClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function isAdmin(userId, supabaseAdminClient) {
  if (!userId) return false;
  const { data } = await supabaseAdminClient.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

export function getClientIp(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
