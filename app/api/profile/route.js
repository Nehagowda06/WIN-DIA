import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/frontend/lib/supabase/server";
import { createSupabaseAdminClient } from "@/src/frontend/lib/supabase/admin";
import { supabase } from "@/src/frontend/lib/supabase";
import { getAuthedUser, sanitizeObject } from "@/src/frontend/lib/security";

async function getCurrentUser(request) {
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (user) return user;
  return getAuthedUser(request, supabase);
}

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile: profile || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        phone: user.phone || "",
        role: "customer",
      },
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ success: false, error: err.message || "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const body = sanitizeObject(await request.json().catch(() => ({})), 500);
    const full_name = body.full_name || body.name || "";
    const phone = body.phone || "";

    if (phone) {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .neq("id", user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: false, error: "This phone number is already in use." }, { status: 409 });
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name,
        phone,
        role: "customer",
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    console.error("Profile PUT error:", err);
    return NextResponse.json({ success: false, error: err.message || "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  return PUT(request);
}
