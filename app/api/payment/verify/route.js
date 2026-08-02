import { supabase } from "@/src/frontend/lib/supabase";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse } from "@/src/frontend/lib/security";
import { verifyPaymentSignature } from "@/src/frontend/lib/razorpay";
import { sendOrderConfirmationEmail, sendAdminNewOrderAlert } from "@/src/frontend/lib/email";

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const body = await req.json().catch(() => ({}));
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return errorResponse("Missing payment verification fields", 400);

  const { data: order, error: fetchErr } = await supabaseAdmin.from("orders").select("*, order_items(*)").eq("id", orderId).single();
  if (fetchErr || !order) return errorResponse("Order not found", 404);
  if (order.user_id !== user.id) return errorResponse("Access denied", 403);
  if (order.razorpay_order_id !== razorpay_order_id) return errorResponse("Payment mismatch", 400);

  const valid = verifyPaymentSignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });

  await supabaseAdmin.from("payment_events").insert({
    order_id: order.id, razorpay_order_id, razorpay_payment_id,
    event_type: "client_verify", status: valid ? "verified" : "signature_mismatch",
    raw_payload: { razorpay_signature },
  });

  if (!valid) return errorResponse("Payment verification failed.", 400);

  if (order.payment_status !== "paid") {
    await supabaseAdmin.from("orders").update({ payment_status: "paid", order_status: "confirmed", razorpay_payment_id, updated_at: new Date().toISOString() }).eq("id", order.id);
    sendOrderConfirmationEmail(order, user.email).catch(console.error);
    sendAdminNewOrderAlert(order).catch(console.error);
  }

  return successResponse({ verified: true, orderId: order.id });
}

