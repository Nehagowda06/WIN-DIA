import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { errorResponse, successResponse } from "@/src/lib/security";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("page_content").select("key, value");
  if (error) return errorResponse("Could not load content", 500);
  return successResponse({ content: Object.fromEntries((data || []).map((c) => [c.key, c.value])) });
}
