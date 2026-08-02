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

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const full_name = body.full_name || body.name || "";
    const address_line1 = body.address_line1 || body.street || "";
    const is_default = Boolean(body.is_default ?? body.isDefault);

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: existing } = await supabaseAdmin
      .from("addresses")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ success: false, error: "Address not found." }, { status: 404 });
    }

    if (is_default) {
      await supabaseAdmin.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    }

    const { data: address, error } = await supabaseAdmin
      .from("addresses")
      .update({
        full_name,
        phone: String(body.phone || ""),
        address_line1,
        address_line2: body.address_line2 || null,
        city: body.city,
        state: body.state,
        pincode: String(body.pincode || ""),
        is_default,
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, address: normalizeAddress(address) });
  } catch (err) {
    console.error("Address PUT error:", err);
    return NextResponse.json({ success: false, error: err.message || "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: existing } = await supabaseAdmin
      .from("addresses")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ success: false, error: "Address not found." }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from("addresses").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Address DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message || "Something went wrong." }, { status: 500 });
  }
}
