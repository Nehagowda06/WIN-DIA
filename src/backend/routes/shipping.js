// Ported from:
//   windia-integrated-version3-main/app/api/shipping/create-shipment/route.js
//   windia-integrated-version3-main/app/api/shipping/track/route.js
//   windia-integrated-version3-main/app/api/shipping/webhook/route.js
// Change: Next.js route handlers → Express router handlers

import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import {
  getAuthedUser,
  isAdmin,
  errorPayload,
  successPayload,
} from "../lib/security.js";
import { getShippingProvider } from "../lib/shipping.js";
import { sendShippingUpdateEmail } from "../lib/email.js";

const router = Router();

// ── DEV ONLY: test auth bypass ───────────────────────────────────────────────
// Add header:  X-Dev-User-Id: test-user-123
// Add header:  X-Dev-Is-Admin: true     ← needed for admin-only routes
// ONLY works when NODE_ENV=development.
function getDevUser(req) {
  if (process.env.NODE_ENV !== "development") return null;
  const devId = req.headers["x-dev-user-id"];
  if (!devId) return null;
  console.warn(`[DEV BYPASS] Using test user id: ${devId}`);
  return { id: devId, email: "devtest@windia.com" };
}

function getDevIsAdmin(req) {
  if (process.env.NODE_ENV !== "development") return false;
  return req.headers["x-dev-is-admin"] === "true";
}

// Status map — NimbusPost raw status → WIN-DIA order status
const STATUS_MAP = {
  picked_up:       "processing",
  in_transit:      "shipped",
  out_for_delivery:"out_for_delivery",
  delivered:       "delivered",
  rto_initiated:   "returned",
  rto_delivered:   "returned",
  cancelled:       "cancelled",
};

// ── POST /api/shipping/create-shipment ───────────────────────────────────────
// Admin-only. Creates a NimbusPost shipment for a confirmed order.
router.post("/create-shipment", async (req, res) => {
  const user = (await getAuthedUser(req, supabase)) || getDevUser(req);
  if (!user) {
    const { payload, status } = errorPayload("Please sign in", 401);
    return res.status(status).json(payload);
  }
  const adminCheck = (await isAdmin(user.id, supabaseAdmin)) || getDevIsAdmin(req);
  if (!adminCheck) {
    const { payload, status } = errorPayload("Admin access required", 403);
    return res.status(status).json(payload);
  }

  const { orderId } = req.body || {};
  if (!orderId) {
    const { payload, status } = errorPayload("orderId is required", 400);
    return res.status(status).json(payload);
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    const { payload, status } = errorPayload("Order not found", 404);
    return res.status(status).json(payload);
  }
  if (order.payment_method === "razorpay" && order.payment_status !== "paid") {
    const { payload, status } = errorPayload("Cannot ship an unpaid order", 409);
    return res.status(status).json(payload);
  }
  if (order.awb_code) {
    const { payload, status } = errorPayload("This order already has a shipment created", 409);
    return res.status(status).json(payload);
  }

  const provider = getShippingProvider();
  const result = await provider.createShipment({
    orderId: order.id,
    orderNumber: order.order_number,
    shippingAddress: order.shipping_address,
    items: order.order_items,
    totalPrice: order.total_price,
    paymentMethod: order.payment_method,
  });

  // Log the shipment attempt regardless of success/failure
  await supabaseAdmin.from("shipments").insert({
    order_id: order.id,
    provider: process.env.SHIPPING_PROVIDER || "nimbuspost",
    awb_code: result.awbCode || null,
    courier_name: result.courierName || null,
    status: result.success ? "created" : "failed",
    tracking_url: result.trackingUrl || null,
    raw_response: result.raw,
  });

  if (!result.success) {
    const { payload, status } = errorPayload(
      `Shipment creation failed: ${result.error}`, 502
    );
    return res.status(status).json(payload);
  }

  await supabaseAdmin.from("orders").update({
    awb_code: result.awbCode,
    courier_name: result.courierName,
    shipping_provider: process.env.SHIPPING_PROVIDER || "nimbuspost",
    order_status: "processing",
    updated_at: new Date().toISOString(),
  }).eq("id", order.id);

  const { payload, status } = successPayload({
    awbCode: result.awbCode,
    courierName: result.courierName,
    trackingUrl: result.trackingUrl,
  });
  return res.status(status).json(payload);
});

// ── GET /api/shipping/track?orderId=xxx ──────────────────────────────────────
// Customer or admin. Returns live tracking status from NimbusPost.
router.get("/track", async (req, res) => {
  const user = (await getAuthedUser(req, supabase)) || getDevUser(req);
  if (!user) {
    const { payload, status } = errorPayload("Please sign in", 401);
    return res.status(status).json(payload);
  }

  const { orderId } = req.query;
  if (!orderId) {
    const { payload, status } = errorPayload("orderId is required", 400);
    return res.status(status).json(payload);
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, awb_code, order_status")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    const { payload, status } = errorPayload("Order not found", 404);
    return res.status(status).json(payload);
  }

  const admin = (await isAdmin(user.id, supabaseAdmin)) || getDevIsAdmin(req);
  if (order.user_id !== user.id && !admin) {
    const { payload, status } = errorPayload("You do not have access to this order", 403);
    return res.status(status).json(payload);
  }

  // Order not shipped yet — return current DB status
  if (!order.awb_code) {
    const { payload, status } = successPayload({
      status: order.order_status,
      history: [],
      shipped: false,
    });
    return res.status(status).json(payload);
  }

  const provider = getShippingProvider();
  const result = await provider.trackShipment(order.awb_code);

  if (!result.success) {
    const { payload, status } = errorPayload(
      `Could not fetch live tracking: ${result.error}`, 502
    );
    return res.status(status).json(payload);
  }

  const { payload, status } = successPayload({
    status: result.status,
    history: result.history,
    shipped: true,
    awbCode: order.awb_code,
  });
  return res.status(status).json(payload);
});

// ── POST /api/shipping/webhook?secret=YOUR_SECRET ────────────────────────────
// NimbusPost Dashboard → Settings → Webhooks
//   URL: https://yourdomain.com/api/shipping/webhook?secret=<APP_SECRET>
//
// NimbusPost doesn't use HMAC-signed webhooks — protected by shared secret
// query param set in .env as APP_SECRET.
router.post("/webhook", async (req, res) => {
  const secret = req.query.secret;
  if (!secret || secret !== process.env.APP_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const awbCode = payload.awb || payload.awb_number;
  const rawStatus = (payload.status || payload.current_status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!awbCode) return res.json({ received: true });

  const { data: shipment } = await supabaseAdmin
    .from("shipments")
    .select("id, order_id")
    .eq("awb_code", awbCode)
    .single();

  if (!shipment) {
    console.warn(`Shipping webhook: no shipment found for AWB ${awbCode}`);
    return res.json({ received: true });
  }

  // Update raw status in shipments table
  await supabaseAdmin.from("shipments").update({
    status: rawStatus,
    raw_response: payload,
    updated_at: new Date().toISOString(),
  }).eq("id", shipment.id);

  const mappedStatus = STATUS_MAP[rawStatus];
  if (!mappedStatus) {
    console.warn(
      `Shipping webhook: unrecognized status "${rawStatus}" for AWB ${awbCode} — add it to STATUS_MAP`
    );
    return res.json({ received: true });
  }

  const update = {
    order_status: mappedStatus,
    updated_at: new Date().toISOString(),
  };
  if (mappedStatus === "delivered") {
    update.delivered_at = new Date().toISOString();
  }

  const { data: updatedOrder } = await supabaseAdmin
    .from("orders")
    .update(update)
    .eq("id", shipment.order_id)
    .select()
    .single();

  if (updatedOrder) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", updatedOrder.user_id)
      .maybeSingle();

    if (profile?.email) {
      sendShippingUpdateEmail(updatedOrder, profile.email).catch((e) =>
        console.error("Shipping update email failed:", e.message)
      );
    }
  }

  return res.json({ received: true });
});

export default router;
