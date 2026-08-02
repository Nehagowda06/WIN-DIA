import { supabase } from "@/src/frontend/lib/supabase";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const { data } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return successResponse({
    profile: data || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      phone: user.phone || "",
      role: "customer",
    },
  });
}

export async function PUT(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const body = sanitizeObject(await req.json().catch(() => ({})), 500);
  const profile = {
    id: user.id,
    email: user.email,
    full_name: body.full_name || body.name || "",
    phone: body.phone || "",
    role: body.role === "admin" ? "customer" : body.role || "customer",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from("profiles").upsert(profile).select().single();
  if (error) return errorResponse("Could not save profile", 500);
  return successResponse({ profile: data });
}

export async function POST(req) {
  return PUT(req);
}
