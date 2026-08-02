import { supabase } from "@/src/frontend/lib/supabase";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse } from "@/src/frontend/lib/security";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  const { data, error } = await supabaseAdmin.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
  if (error) return errorResponse("Could not load addresses", 500);
  return successResponse({ addresses: (data || []).map((address) => ({
    ...address,
    name: address.full_name,
    street: address.address_line1,
  })) });
}

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  const body = await req.json().catch(() => ({}));
  const { name, street, city, state, pincode, phone, type = "home", isDefault = false } = body;
  if (!name || !street || !city || !state || !pincode || !phone)
    return errorResponse("All address fields are required", 400);

  if (isDefault) await supabaseAdmin.from("addresses").update({ is_default: false }).eq("user_id", user.id);

  const { data, error } = await supabaseAdmin.from("addresses").insert({
    user_id: user.id, full_name: name, address_line1: street, city, state,
    pincode: String(pincode), phone: String(phone), type, is_default: isDefault,
  }).select().single();

  if (error) return errorResponse("Could not save address", 500);
  return successResponse({ address: { ...data, name: data.full_name, street: data.address_line1 } }, 201);
}

