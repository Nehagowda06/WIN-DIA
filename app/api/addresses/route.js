import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/frontend/lib/supabase/server";
import { createSupabaseAdminClient } from "@/src/frontend/lib/supabase/admin";
import { supabase } from "@/src/frontend/lib/supabase";
import { getAuthedUser } from "@/src/frontend/lib/security";

async function getCurrentUser(request) {
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (user) return user;
  return getAuthedUser(request, supabase);
}

function normalizeAddress(address) {
  if (!address) return address;
  return {
    ...address,
    name: address.name || address.full_name || "",
    street: address.street || address.address_line1 || "",
    full_name: address.full_name || address.name || "",
    address_line1: address.address_line1 || address.street || "",
    type: address.type || "home",
    isDefault: Boolean(address.is_default),
  };
}

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: addresses, error } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, addresses: (addresses || []).map(normalizeAddress) });
  } catch (err) {
    console.error("Addresses GET error:", err);
    return NextResponse.json({ success: false, error: err.message || "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const full_name = body.full_name || body.name || "";
    const address_line1 = body.address_line1 || body.street || "";
    const is_default = Boolean(body.is_default ?? body.isDefault);

    if (!full_name || !address_line1 || !body.city || !body.state || !body.pincode || !body.phone) {
      return NextResponse.json({ success: false, error: "All address fields are required" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    if (is_default) {
      await supabaseAdmin.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    }

    const { data: address, error } = await supabaseAdmin
      .from("addresses")
      .insert({
        user_id: user.id,
        full_name,
        phone: String(body.phone),
        address_line1,
        address_line2: body.address_line2 || null,
        city: body.city,
        state: body.state,
        pincode: String(body.pincode),
        is_default,
      })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, address: normalizeAddress(address) }, { status: 201 });
  } catch (err) {
    console.error("Addresses POST error:", err);
    return NextResponse.json({ success: false, error: err.message || "Something went wrong." }, { status: 500 });
  }
}
