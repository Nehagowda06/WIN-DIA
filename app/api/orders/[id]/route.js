import { supabase } from "@/src/frontend/lib/supabase";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse } from "@/src/frontend/lib/security";

export async function GET(req, { params }) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const { id } = await params;
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (error || !order) return errorResponse("Order not found", 404);
  if (order.user_id !== user.id) return errorResponse("Access denied", 403);
  return successResponse({ order });
}
