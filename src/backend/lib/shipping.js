/**
 * NimbusPost Shipping Integration
 *
 * ALL ENDPOINTS VERIFIED via Chrome DevTools (2026-08-01):
 *
 *   Base URL:    https://api-v2.nimbuspost.com
 *   Auth:        Authorization: Bearer <NIMBUSPOST_ACCESS_TOKEN>
 *
 *   Step 1 — Create order:
 *     POST /orders/api/v1/orders
 *     → returns data.order_id
 *
 *   Step 2 — Get shipping rates:
 *     GET /orders/api/v1/shipments/{order_id}/rates?maskCourierIdentity=false
 *     → returns array of couriers with rate_quote_token + courier_id
 *
 *   Step 3 — Book shipment (generates AWB):
 *     POST /orders/api/v1/shipments/book
 *     body: { order_id, courier_id, rate_quote_token }
 *     → returns data.shipment.awb
 *
 *   Track:
 *     GET /orders/api/v1/orders/{order_id}
 *     → returns data.shipment.awb, data.order_status
 *
 * HOW TO REFRESH TOKEN (expires every 24h):
 *   1. Log in to https://app.nimbuspost.com (complete OTP)
 *   2. DevTools → Network → filter "api-v2.nimbuspost.com"
 *   3. Click any request → Headers → copy Authorization value (after "Bearer ")
 *   4. Update NIMBUSPOST_ACCESS_TOKEN in .env.local → restart server
 *
 * ENV vars required:
 *   NIMBUSPOST_ACCESS_TOKEN   ← Bearer token from dashboard login
 *   NIMBUSPOST_BASE_URL       ← https://api-v2.nimbuspost.com
 *   NIMBUSPOST_WAREHOUSE_ID   ← f2883367-d9a6-4889-9ede-b183762a7a8d
 *   NIMBUSPOST_CHANNEL_ID     ← 6a59ceed9897ea1c4ef7c20e (Manual channel)
 *   SHIPPING_PROVIDER         ← nimbuspost
 */

const BASE_URL = process.env.NIMBUSPOST_BASE_URL || "https://api-v2.nimbuspost.com";

// ── Token management ──────────────────────────────────────────────────────────
// Caches the access token in memory and auto-refreshes using the 30-day
// npRefresh cookie when it expires.
let _cachedToken = null;
let _tokenExpiry = 0;

async function getAccessToken() {
  // If cached token is still valid (with 5 min buffer), use it
  if (_cachedToken && Date.now() < _tokenExpiry - 5 * 60 * 1000) {
    return _cachedToken;
  }

  const refreshToken = process.env.NIMBUSPOST_REFRESH_TOKEN;
  const accessToken  = process.env.NIMBUSPOST_ACCESS_TOKEN;

  // Try to refresh using the 30-day cookie
  if (refreshToken && !refreshToken.startsWith("REPLACE_ME")) {
    try {
      const res = await fetch(`${BASE_URL}/auth/api/v1/sessions/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `npRefresh=${refreshToken}`,
        },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success && data?.data?.accessToken) {
        _cachedToken = data.data.accessToken;
        // JWT exp is in seconds — convert to ms
        const payload = JSON.parse(Buffer.from(_cachedToken.split(".")[1], "base64url").toString());
        _tokenExpiry = payload.exp * 1000;
        console.log("[NimbusPost] Token refreshed successfully");
        return _cachedToken;
      }
      console.warn("[NimbusPost] Token refresh failed:", data?.error?.detail || "unknown");
    } catch (err) {
      console.warn("[NimbusPost] Token refresh error:", err.message);
    }
  }

  // Fall back to static access token from env
  if (accessToken && !accessToken.startsWith("REPLACE_ME") && accessToken.length > 20) {
    _cachedToken = accessToken;
    try {
      const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
      _tokenExpiry = payload.exp * 1000;
    } catch { _tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; }
    return _cachedToken;
  }

  throw new Error(
    "NimbusPost auth failed. NIMBUSPOST_REFRESH_TOKEN is missing or expired.\n" +
    "Log in to https://app.nimbuspost.com, copy the npRefresh cookie from DevTools, and update .env.local."
  );
}

function getAuthHeader() {
  // Synchronous check — actual refresh is async, called before each request
  if (!_cachedToken) throw new Error("Call getAccessToken() before getAuthHeader()");
  return { Authorization: `Bearer ${_cachedToken}` };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function npFetch(path, options = {}) {
  // Ensure token is fresh before every request
  await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { success: false, error: { detail: text.slice(0, 200) } }; }
  return { ok: res.ok, status: res.status, data };
}

// ── Provider factory ──────────────────────────────────────────────────────────
export function getShippingProvider() {
  const provider = process.env.SHIPPING_PROVIDER || "nimbuspost";
  if (provider === "nimbuspost") return nimbusPostProvider;
  throw new Error(`Unknown SHIPPING_PROVIDER "${provider}".`);
}

// ── NimbusPost provider ───────────────────────────────────────────────────────
const nimbusPostProvider = {

  /**
   * Creates a shipment — 3-step verified flow:
   *   1. Create order  → order_id
   *   2. Get rates     → rate_quote_token + courier_id (picks cheapest)
   *   3. Book shipment → AWB
   */
  async createShipment({ orderId, orderNumber, shippingAddress, items, totalPrice, paymentMethod }) {

    const warehouseId = process.env.NIMBUSPOST_WAREHOUSE_ID;
    const channelId   = process.env.NIMBUSPOST_CHANNEL_ID || "6a59ceed9897ea1c4ef7c20e";

    if (!warehouseId) {
      return { success: false, error: "NIMBUSPOST_WAREHOUSE_ID not set in .env.local", raw: {} };
    }

    // Weight in kg — minimum 0.1 kg
    const totalWeightKg = Math.max(
      0.1,
      items.reduce((sum, i) => sum + (Number(i.net_weight_grams) || 0) * (i.qty || 1), 0) / 1000
    );

    // ── STEP 1: Create order ──────────────────────────────────────────────────
    const orderPayload = {
      order_number:   String(orderNumber),
      order_type:     "b2c",
      payment_mode:   paymentMethod === "cod" ? "cod" : "prepaid",
      warehouse_id:   warehouseId,
      channel_id:     channelId,
      channel_name:   "Manual",
      same_as_billing: true,
      shipping_address: {
        name:    shippingAddress.name || `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim(),
        address: shippingAddress.address || shippingAddress.street || "",
        pincode: Number(shippingAddress.pincode || shippingAddress.postalCode),
        city:    (shippingAddress.city || "").toUpperCase(),
        state:   (shippingAddress.state || "").toUpperCase(),
        phone:   Number(String(shippingAddress.phone || "").replace(/\D/g, "")),
        email:   shippingAddress.email || "",
      },
      items: items.map((item) => ({
        name:             item.name,
        qty:              item.qty || 1,
        price:            Number(item.price),
        sku:              item.product_id || item.id || "",
        category:         "",
        weight:           0,
        length:           0,
        width:            0,
        height:           0,
        hsn:              "",
        discount_amount:  0,
        tax_rate:         0,
        item_total_amount: Number(item.price) * (item.qty || 1),
        images:           [],
      })),
      package: {
        weight:          totalWeightKg,
        length:          20,
        width:           15,
        height:          10,
        is_fragile:      false,
        essential_order: false,
        dg_order:        false,
      },
      total_amount:              totalPrice,
      order_collectable_amount:  paymentMethod === "cod" ? totalPrice : 0,
    };

    const createRes = await npFetch("/orders/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });

    if (!createRes.ok || !createRes.data?.success) {
      return {
        success: false,
        error: createRes.data?.error?.detail || createRes.data?.message || "Order creation failed",
        raw: createRes.data,
      };
    }

    const npOrderId = createRes.data.data.order_id;

    // ── STEP 2: Get rates ─────────────────────────────────────────────────────
    const ratesRes = await npFetch(
      `/orders/api/v1/shipments/${npOrderId}/rates?maskCourierIdentity=false`,
      { method: "GET" }
    );

    if (!ratesRes.ok || !ratesRes.data?.success) {
      return {
        success: false,
        error: ratesRes.data?.error?.detail || "Could not fetch shipping rates",
        raw: ratesRes.data,
        npOrderId,
      };
    }

    const rates = ratesRes.data.data?.rates || ratesRes.data.data || [];
    if (!Array.isArray(rates) || rates.length === 0) {
      return { success: false, error: "No courier rates available for this pincode", raw: ratesRes.data, npOrderId };
    }

    // Pick cheapest courier
    const cheapest = rates.reduce((best, r) =>
      (r.price?.totalPaise || Infinity) < (best.price?.totalPaise || Infinity) ? r : best
    , rates[0]);

    const courierId     = cheapest.courierId;
    const rateQuoteToken = ratesRes.data.data?.rate_quote_token || ratesRes.data.data?.rateQuoteToken;
    const courierName   = cheapest.courierDisplayName || cheapest.courierName || "NimbusPost";

    if (!courierId || !rateQuoteToken) {
      return { success: false, error: "Could not extract courier_id or rate_quote_token from rates response", raw: ratesRes.data, npOrderId };
    }

    // ── STEP 3: Book shipment ─────────────────────────────────────────────────
    const bookRes = await npFetch("/orders/api/v1/shipments/book", {
      method: "POST",
      body: JSON.stringify({
        order_id:        npOrderId,
        courier_id:      courierId,
        rate_quote_token: rateQuoteToken,
      }),
    });

    if (!bookRes.ok || !bookRes.data?.success) {
      const detail = bookRes.data?.error?.detail || bookRes.data?.message || "Shipment booking failed";
      // Wallet error — surface clearly
      if (bookRes.data?.error?.details?.code === "INSUFFICIENT_BALANCE") {
        return {
          success: false,
          error: `Insufficient wallet balance. Need ₹${bookRes.data.error.details.requested}, have ₹${bookRes.data.error.details.spendable}`,
          raw: bookRes.data,
          npOrderId,
        };
      }
      return { success: false, error: detail, raw: bookRes.data, npOrderId };
    }

    const awb          = bookRes.data.data?.shipment?.awb || bookRes.data.data?.awb || "";
    const trackingUrl  = awb ? `https://app.nimbuspost.com/tracking/${awb}` : "";
    const labelUrl     = bookRes.data.data?.shipment?.label_url || "";

    return {
      success:      true,
      awbCode:      awb,
      courierName,
      trackingUrl,
      labelUrl,
      npOrderId,
      raw:          bookRes.data,
    };
  },

  /**
   * Tracks a shipment by NimbusPost order_id (stored as awb_code in our DB
   * until AWB is assigned; once AWB exists we use the order detail endpoint).
   */
  async trackShipment(awbOrOrderId) {
    // Try to get order details — order_id is stored in our shipments table
    const { ok, data } = await npFetch(
      `/orders/api/v1/orders/${awbOrOrderId}`,
      { method: "GET" }
    );

    if (!ok || !data?.success) {
      return { success: false, error: data?.error?.detail || "Could not fetch tracking info" };
    }

    const orderData = data.data;
    const shipment  = orderData?.shipment || {};

    return {
      success:  true,
      status:   orderData.order_status || "",
      awbCode:  shipment.awb || "",
      history:  [], // NimbusPost tracking history requires separate courier tracking API
    };
  },
};
