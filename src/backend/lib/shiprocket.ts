/**
 * Shiprocket Shipping Integration
 * ────────────────────────────────
 * Server-to-server API integration using email/password authentication.
 * Token is valid for 10 days and auto-refreshes when expired.
 *
 * API Docs: https://apidocs.shiprocket.in/
 * Base URL: https://apiv2.shiprocket.in/v1/external
 *
 * ENV vars required:
 *   SHIPROCKET_EMAIL    - Login email for Shiprocket account
 *   SHIPROCKET_PASSWORD - Password for Shiprocket account
 *   SHIPPING_PROVIDER   - "shiprocket"
 */

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// ── Token management ──────────────────────────────────────────────────────────
let _cachedToken: string | null = null;
let _tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  // Token valid for 10 days — refresh with 1 hour buffer
  if (_cachedToken && Date.now() < _tokenExpiry - 60 * 60 * 1000) {
    return _cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password || email.startsWith('REPLACE_ME') || password.startsWith('REPLACE_ME')) {
    throw new Error(
      'Shiprocket is not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in your .env file.'
    );
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.token) {
    console.error('[Shiprocket] Auth failed:', data.message || data.errors || 'Unknown error');
    throw new Error(`Shiprocket authentication failed: ${data.message || 'Invalid credentials'}`);
  }

  _cachedToken = data.token;
  // Token valid for 10 days
  _tokenExpiry = Date.now() + 10 * 24 * 60 * 60 * 1000;
  console.log('[Shiprocket] Token acquired successfully');
  return _cachedToken!;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function srFetch(path: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: any }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { success: false, message: text.slice(0, 200) }; }
  return { ok: res.ok, status: res.status, data };
}

// ── Shiprocket Provider ───────────────────────────────────────────────────────
export interface ShipmentResult {
  success: boolean;
  awbCode?: string;
  shipmentId?: string;
  orderId?: string;
  courierName?: string;
  trackingUrl?: string;
  error?: string;
  raw?: any;
}

export interface TrackingResult {
  success: boolean;
  status?: string;
  history?: Array<{ date: string; status: string; location?: string }>;
  error?: string;
}

export interface CreateShipmentParams {
  orderId: string;
  orderNumber: string;
  shippingAddress: {
    name?: string;
    full_name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    postalCode?: string;
    email?: string;
    country?: string;
  };
  items: Array<{
    name: string;
    qty: number;
    price: number;
    product_id?: string;
    sku?: string;
    net_weight_grams?: number;
  }>;
  totalPrice: number;
  paymentMethod: string;
  // Bundle pricing metadata
  packetsShipped?: number;
}

export const shiprocketProvider = {
  /**
   * Creates an order + requests shipment on Shiprocket.
   * Shiprocket handles courier assignment automatically.
   */
  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const { orderId, orderNumber, shippingAddress, items, totalPrice, paymentMethod } = params;

    const addr = shippingAddress;
    const customerName = addr.name || addr.full_name ||
      `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Customer';
    const phone = String(addr.phone || '').replace(/\D/g, '');
    const address1 = addr.address_line1 || addr.street || '';
    const address2 = addr.address_line2 || '';
    const city = addr.city || '';
    const state = addr.state || '';
    const pincode = String(addr.pincode || addr.postalCode || '');
    const country = addr.country || 'India';
    const email = addr.email || '';

    // Calculate total weight in kg
    const totalWeightKg = Math.max(
      0.5,
      items.reduce((sum, i) => sum + (Number(i.net_weight_grams) || 200) * (i.qty || 1), 0) / 1000
    );

    // Build order payload for Shiprocket
    const orderPayload = {
      order_id: orderNumber, // Shiprocket uses this as the reference
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: 'Primary', // Must match a pickup location in Shiprocket dashboard
      billing_customer_name: customerName.split(' ')[0] || customerName,
      billing_last_name: customerName.split(' ').slice(1).join(' ') || '',
      billing_address: address1,
      billing_address_2: address2,
      billing_city: city,
      billing_pincode: pincode,
      billing_state: state,
      billing_country: country,
      billing_email: email || 'customer@windia.in',
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: items.map((item) => ({
        name: item.name,
        sku: item.sku || item.product_id || `WIN-${item.name.slice(0, 10)}`,
        units: item.qty,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: '',
      })),
      payment_method: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      sub_total: totalPrice,
      length: 25, // cm — approximate package dimensions
      breadth: 20,
      height: 15,
      weight: totalWeightKg,
    };

    // STEP 1: Create order on Shiprocket
    const createRes = await srFetch('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });

    if (!createRes.ok || !createRes.data?.order_id) {
      return {
        success: false,
        error: createRes.data?.message || createRes.data?.errors?.toString() || 'Order creation failed',
        raw: createRes.data,
      };
    }

    const shiprocketOrderId = createRes.data.order_id;
    const shiprocketShipmentId = createRes.data.shipment_id;

    // STEP 2: Request AWB (auto-assigns courier)
    // If shipment_id is returned, Shiprocket auto-assigns a courier
    if (shiprocketShipmentId) {
      const awbRes = await srFetch('/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify({ shipment_id: shiprocketShipmentId }),
      });

      if (awbRes.ok && awbRes.data?.response?.data?.awb_code) {
        const awbData = awbRes.data.response.data;
        return {
          success: true,
          awbCode: awbData.awb_code,
          shipmentId: String(shiprocketShipmentId),
          orderId: String(shiprocketOrderId),
          courierName: awbData.courier_name || 'Shiprocket',
          trackingUrl: `https://shiprocket.co/tracking/${awbData.awb_code}`,
          raw: awbRes.data,
        };
      }

      // AWB assignment failed but order was created
      return {
        success: true,
        shipmentId: String(shiprocketShipmentId),
        orderId: String(shiprocketOrderId),
        courierName: 'Pending Assignment',
        error: 'Order created but AWB not yet assigned. Courier will be assigned automatically.',
        raw: createRes.data,
      };
    }

    // Order created without auto-shipment
    return {
      success: true,
      orderId: String(shiprocketOrderId),
      courierName: 'Pending',
      raw: createRes.data,
    };
  },

  /**
   * Track a shipment by AWB code or Shiprocket shipment ID.
   */
  async trackShipment(awbCodeOrShipmentId: string): Promise<TrackingResult> {
    // Try tracking by AWB
    const res = await srFetch(`/courier/track/awb/${awbCodeOrShipmentId}`);

    if (!res.ok || !res.data?.tracking_data) {
      // Fallback: try by shipment ID
      const res2 = await srFetch(`/courier/track/shipment/${awbCodeOrShipmentId}`);
      if (!res2.ok || !res2.data?.tracking_data) {
        return {
          success: false,
          error: res.data?.message || 'Tracking information not available',
        };
      }
      return parseTrackingResponse(res2.data.tracking_data);
    }

    return parseTrackingResponse(res.data.tracking_data);
  },

  /**
   * Cancel a shipment on Shiprocket.
   */
  async cancelShipment(shiprocketOrderId: string): Promise<{ success: boolean; error?: string }> {
    const res = await srFetch('/orders/cancel', {
      method: 'POST',
      body: JSON.stringify({ ids: [Number(shiprocketOrderId)] }),
    });

    if (!res.ok) {
      return { success: false, error: res.data?.message || 'Cancellation failed' };
    }

    return { success: true };
  },
};

function parseTrackingResponse(trackingData: any): TrackingResult {
  const shipmentTrack = trackingData.shipment_track || [];
  const currentStatus = trackingData.shipment_status_text || trackingData.current_status || '';

  const history = (trackingData.shipment_track_activities || shipmentTrack).map((activity: any) => ({
    date: activity.date || activity['sr-status-date'] || '',
    status: activity.activity || activity.status || '',
    location: activity.location || '',
  }));

  return {
    success: true,
    status: currentStatus,
    history,
  };
}

// ── Provider factory ──────────────────────────────────────────────────────────
export function getShippingProvider() {
  const provider = process.env.SHIPPING_PROVIDER || 'shiprocket';
  if (provider === 'shiprocket') return shiprocketProvider;
  throw new Error(`Unknown SHIPPING_PROVIDER "${provider}". Use "shiprocket".`);
}
