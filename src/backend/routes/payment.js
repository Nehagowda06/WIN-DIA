// Ported from:
//   windia-integrated-version3-main/app/api/payment/verify/route.js
//   windia-integrated-version3-main/app/api/payment/webhook/route.js
// Change: Next.js route handlers → Express router handlers
//         NextResponse.json() → res.status().json()
//         req.text() for raw body → handled in server.js via express.raw()

import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { getAuthedUser, errorPayload, successPayload, getClientIp } from "../lib/security.js";
import { getRazorpayClient, verifyPaymentSignature, verifyWebhookSignature } from "../lib/razorpay.js";
import { sendOrderConfirmationEmail, sendAdminNewOrderAlert } from "../lib/email.js";
import { rateLimit } from "../lib/rateLimit.js";

const router = Router();

// ── DEV ONLY: test auth bypass ───────────────────────────────────────────────
// Lets you test routes in Postman without a real Supabase user.
// Add header:  X-Dev-User-Id: test-user-123
// ONLY works when NODE_ENV=development. Remove before go-live.
function getDevUser(req) {
  if (process.env.NODE_ENV !== "development") return null;
  const devId = req.headers["x-dev-user-id"];
  if (!devId) return null;
  console.warn(`[DEV BYPASS] Using test user id: ${devId}`);
  return { id: devId, email: "devtest@windia.com" };
}

// ── POST /api/payment/create-order ──────────────────────────────────────────
// Called by checkout after the order row is already created in DB.
// Creates a Razorpay order and returns the payment params for the frontend SDK.
router.post("/create-order", async (req, res) => {
  const user = (await getAuthedUser(req, supabase)) || getDevUser(req);
  if (!user) {
    const { payload, status } = errorPayload("Please sign in", 401);
    return res.status(status).json(payload);
  }

  const ip = getClientIp(req);
  const limit = rateLimit(`payment-create:${user.id}:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    const { payload, status } = errorPayload("Too many requests. Please wait a few minutes.", 429);
    return res.status(status).json(payload);
  }

  const { orderId } = req.body || {};
  if (!orderId) {
    const { payload, status } = errorPayload("orderId is required", 400);
    return res.status(status).json(payload);
  }

  // Fetch the order to get the confirmed total (never trust amount from client)
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, order_number, total_price, payment_status, razorpay_order_id")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) {
    console.error("Order fetch error:", fetchErr?.message, fetchErr?.cause, "orderId:", orderId);
    const { payload, status } = errorPayload("Order not found", 404);
    return res.status(status).json(payload);
  }
  // Skip ownership check in dev bypass mode
  const isDevBypass = process.env.NODE_ENV === "development" && req.headers["x-dev-user-id"];
  if (!isDevBypass && order.user_id !== user.id) {
    const { payload, status } = errorPayload("You do not have access to this order", 403);
    return res.status(status).json(payload);
  }
  if (order.payment_status === "paid") {
    const { payload, status } = errorPayload("This order has already been paid", 409);
    return res.status(status).json(payload);
  }

  // Reuse existing Razorpay order if one was already created (e.g. page refresh)
  if (order.razorpay_order_id) {
    const { payload, status } = successPayload({
      razorpay: {
        orderId: order.razorpay_order_id,
        amount: Math.round(order.total_price * 100),
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    });
    return res.status(status).json(payload);
  }

  try {
    const razorpay = getRazorpayClient();
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(order.total_price * 100),
      currency: "INR",
      receipt: order.order_number,
      notes: { internal_order_id: order.id },
    });

    await supabaseAdmin
      .from("orders")
      .update({ razorpay_order_id: rpOrder.id })
      .eq("id", order.id);

    const { payload, status } = successPayload({
      razorpay: {
        orderId: rpOrder.id,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    });
    return res.status(status).json(payload);
  } catch (err) {
    console.error("Razorpay order creation failed:", err.message);
    const { payload, status } = errorPayload(
      "Payment gateway error. Check your Razorpay keys in .env.", 503
    );
    return res.status(status).json(payload);
  }
});

// ── POST /api/payment/verify ─────────────────────────────────────────────────
// Called by frontend after the Razorpay checkout modal closes successfully.
// Verifies the HMAC signature and marks the order as paid.
router.post("/verify", async (req, res) => {
  const user = (await getAuthedUser(req, supabase)) || getDevUser(req);
  if (!user) {
    const { payload, status } = errorPayload("Please sign in", 401);
    return res.status(status).json(payload);
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    const { payload, status } = errorPayload("Missing payment verification fields", 400);
    return res.status(status).json(payload);
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) {
    const { payload, status } = errorPayload("Order not found", 404);
    return res.status(status).json(payload);
  }
  // Skip ownership check in dev bypass mode
  const isDevBypass = process.env.NODE_ENV === "development" && req.headers["x-dev-user-id"];
  if (!isDevBypass && order.user_id !== user.id) {
    const { payload, status } = errorPayload("You do not have access to this order", 403);
    return res.status(status).json(payload);
  }
  if (order.razorpay_order_id !== razorpay_order_id) {
    const { payload, status } = errorPayload("Payment does not match this order", 400);
    return res.status(status).json(payload);
  }

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  // Log every verification attempt for audit trail
  await supabaseAdmin.from("payment_events").insert({
    order_id: order.id,
    razorpay_order_id,
    razorpay_payment_id,
    event_type: "client_verify",
    status: valid ? "verified" : "signature_mismatch",
    raw_payload: { razorpay_signature },
  });

  if (!valid) {
    const { payload, status } = errorPayload(
      "Payment verification failed. If money was deducted, it will be auto-refunded or resolved via support.",
      400
    );
    return res.status(status).json(payload);
  }

  if (order.payment_status !== "paid") {
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "confirmed",
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // Fire-and-forget — slow email shouldn't block the payment response
    sendOrderConfirmationEmail(order, user.email).catch((e) =>
      console.error("Order confirmation email failed:", e.message)
    );
    sendAdminNewOrderAlert(order).catch((e) =>
      console.error("Admin order alert failed:", e.message)
    );
  }

  const { payload, status } = successPayload({ verified: true, orderId: order.id });
  return res.status(status).json(payload);
});

// ── POST /api/payment/webhook ────────────────────────────────────────────────
// Razorpay Dashboard → Settings → Webhooks → https://yourdomain.com/api/payment/webhook
// Subscribe to: payment.captured, payment.failed, order.paid
//
// Raw body is preserved in server.js via express.raw() on this path,
// which is required for HMAC signature verification.
router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  // req.body is a Buffer here (express.raw middleware in server.js)
  const rawBody = req.body?.toString?.() || "";

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    console.warn("Razorpay webhook: invalid signature — request rejected");
    return res.status(400).json({ error: "Invalid signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const eventType = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const razorpayPaymentId = paymentEntity?.id;

  // Always log the raw event
  await supabaseAdmin.from("payment_events").insert({
    razorpay_order_id: razorpayOrderId || null,
    razorpay_payment_id: razorpayPaymentId || null,
    event_type: eventType || "unknown",
    status: paymentEntity?.status || "unknown",
    raw_payload: payload,
  });

  if (!razorpayOrderId) return res.json({ received: true });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status")
    .eq("razorpay_order_id", razorpayOrderId)
    .single();

  if (!order) {
    console.warn(`Razorpay webhook: no order found for razorpay_order_id ${razorpayOrderId}`);
    return res.json({ received: true });
  }

  if (eventType === "payment.captured" || eventType === "order.paid") {
    if (order.payment_status !== "paid") {
      await supabaseAdmin.from("orders").update({
        payment_status: "paid",
        order_status: "confirmed",
        razorpay_payment_id: razorpayPaymentId,
        updated_at: new Date().toISOString(),
      }).eq("id", order.id);
    }
  } else if (eventType === "payment.failed") {
    if (order.payment_status === "pending") {
      await supabaseAdmin.from("orders").update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", order.id);
    }
  }

  return res.json({ received: true });
});

export default router;
