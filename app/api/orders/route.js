import { supabase } from "@/src/frontend/lib/supabase";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";
import { validateAddress } from "@/src/frontend/lib/validation";
import { rateLimit, getClientIp } from "@/src/frontend/lib/rateLimit";
import { getRazorpayClient } from "@/src/frontend/lib/razorpay";
import { sendOrderConfirmationEmail, sendAdminNewOrderAlert } from "@/src/frontend/lib/email";
import { localProducts } from "@/src/frontend/data/products";
import { createHash, randomUUID } from "crypto";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function stableProductUuid(value) {
  const text = String(value || "");
  if (uuidPattern.test(text)) return text;

  const hex = createHash("sha1").update(`windia-product:${text}`).digest("hex");
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variant}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function productKey(item) {
  return String(item.productId || item.id || item._id || "");
}

function productSnapshot(product, sourceId = product.id || product._id) {
  return {
    id: stableProductUuid(sourceId),
    name: product.name || "WIN-DIA Product",
    price: Number(product.price || 1),
    image: product.image || product.image_url || null,
    count_in_stock: Number(product.countInStock ?? product.count_in_stock ?? 999),
    is_active: product.is_active ?? true,
    net_weight: Number(product.netWeight ?? product.net_weight ?? product.weight ?? 200),
  };
}

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in to place an order", 401);

  const ip = getClientIp(req);
  if (!rateLimit(`order:${user.id}:${ip}`, 10, 10 * 60 * 1000).allowed)
    return errorResponse("Too many attempts. Please wait.", 429);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid request", 400); }
  const { items, shippingAddress, paymentMethod, orderNotes, deliverySpeed, couponCode } = sanitizeObject(body, 2000);

  if (!Array.isArray(items) || items.length === 0) return errorResponse("Cart is empty", 400);
  if (!["razorpay", "cod"].includes(paymentMethod)) return errorResponse("Invalid payment method", 400);

  const addrErrors = validateAddress(shippingAddress || {});
  if (Object.keys(addrErrors).length > 0) return errorResponse("Invalid address", 400, { fieldErrors: addrErrors });

  const rawProductIds = [...new Set(items.map((i) => i.productId || i.id || i._id).filter(Boolean))];
  const productIds = rawProductIds.map(stableProductUuid);

  let products = [];
  if (productIds.length) {
    const result = await supabaseAdmin
      .from("products")
      .select("id,name,price,image,image_url,count_in_stock,is_active,net_weight")
      .in("id", productIds);
    if (!result.error) products = result.data || [];
  }

  const productMap = new Map((products || []).flatMap((p) => [[p.id, p], [String(p.id), p]]));
  const legacyProductAliases = {
    "prod-test-001": "11111111-1111-4111-8111-111111111111",
    "prod-test-002": "22222222-2222-4222-8222-222222222222",
    "prod-test-003": "33333333-3333-4333-8333-333333333333",
  };
  const findFallbackForItem = (item) => {
    const rawId = productKey(item);
    const rawName = String(item.name || "").toLowerCase();
    const aliasId = legacyProductAliases[rawId];
    return localProducts.find((p) => p.id === rawId || p._id === rawId || p.id === aliasId || p.name.toLowerCase() === rawName);
  };
  const fallbackProducts = [
    ...new Map(items.map((item) => {
      const fallback = findFallbackForItem(item);
      return fallback ? [productKey(item), { fallback, sourceId: productKey(item) }] : null;
    }).filter(Boolean)).values(),
  ];
  const missingProducts = fallbackProducts
    .map(({ fallback, sourceId }) => productSnapshot(fallback, sourceId))
    .filter((p) => !productMap.has(p.id));
  if (missingProducts.length) {
    const { error: productUpsertErr } = await supabaseAdmin.from("products").upsert(missingProducts).select();
    if (productUpsertErr) {
      console.error("Product upsert failed:", productUpsertErr);
      return errorResponse("Could not verify products", 500);
    }
    missingProducts.forEach((p) => productMap.set(p.id, p));
  }
  for (const raw of items) {
    const rawId = productKey(raw);
    const normalizedId = stableProductUuid(rawId);
    if (productMap.has(normalizedId)) {
      productMap.set(rawId, productMap.get(normalizedId));
      continue;
    }
    const fallback = findFallbackForItem(raw);
    if (fallback) productMap.set(rawId, productMap.get(normalizedId) || productSnapshot(fallback, rawId));
  }

  for (const raw of items) {
    const rawId = productKey(raw);
    if (productMap.has(rawId)) continue;

    const snapshotProduct = productSnapshot(raw, rawId || randomUUID());

    const { error: snapshotErr } = await supabaseAdmin.from("products").upsert(snapshotProduct).select();
    if (snapshotErr) {
      console.error("Snapshot product upsert failed:", snapshotErr);
      return errorResponse("Could not verify products", 500);
    }
    productMap.set(rawId, snapshotProduct);
    productMap.set(snapshotProduct.id, snapshotProduct);
  }
  const orderItems = [];
  let itemsPrice = 0;

  for (const raw of items) {
    const product = productMap.get(productKey(raw));
    const qty = Math.max(1, Math.min(20, parseInt(raw.qty) || 1));
    if (!product || product.is_active === false) return errorResponse("A product is no longer available", 409);
    if (product.count_in_stock < qty) return errorResponse(`"${product.name}" only has ${product.count_in_stock} left`, 409);
    itemsPrice += Number(product.price) * qty;
    orderItems.push({ product_id: product.id, name: product.name, image: product.image || product.image_url || null, price: Number(product.price), qty, flavor: raw.flavor || null, net_weight_grams: Number(product.net_weight ?? 0) });
  }

  const shippingPrice = itemsPrice >= 499 ? 0 : 50;
  const expressSurcharge = deliverySpeed === "express" ? 100 : 0;
  const { data: taxSetting } = await supabaseAdmin.from("settings").select("value").eq("key", "tax_rate_percent").maybeSingle();
  const taxRatePercent = taxSetting ? Number(taxSetting.value) : 5;
  const taxPrice = Math.round(itemsPrice * (taxRatePercent / 100) * 100) / 100;

  let discountPrice = 0;
  if (couponCode) {
    const { data: coupon } = await supabaseAdmin.from("coupons").select("*").ilike("code", couponCode.trim()).maybeSingle();
    if (coupon && coupon.active && (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) && (!coupon.usage_limit || coupon.times_used < coupon.usage_limit) && itemsPrice >= Number(coupon.min_order_value || 0)) {
      discountPrice = Math.round(itemsPrice * (Number(coupon.discount_percent) / 100) * 100) / 100;
      await supabaseAdmin.from("coupons").update({ times_used: coupon.times_used + 1 }).eq("id", coupon.id);
    }
  }

  const totalPrice = Math.round((itemsPrice + taxPrice + shippingPrice + expressSurcharge - discountPrice) * 100) / 100;
  const { data: orderNumberData } = await supabaseAdmin.rpc("generate_order_number");
  const orderNumber = orderNumberData || `WIN-${Date.now()}`;

  const { data: order, error: orderErr } = await supabaseAdmin.from("orders").insert({
    order_number: orderNumber, user_id: user.id, shipping_address: shippingAddress,
    order_notes: orderNotes || null, items_price: itemsPrice, tax_price: taxPrice,
    shipping_price: shippingPrice + expressSurcharge, discount_price: discountPrice,
    total_price: totalPrice,
    payment_method: paymentMethod, payment_status: "pending", order_status: "placed",
  }).select().single();

  if (orderErr) {
    console.error("Order insert failed:", orderErr);
    return errorResponse("Could not create order", 500);
  }

  const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
  if (itemsErr) {
    console.error("Order items insert failed:", itemsErr);
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    return errorResponse("Could not create order", 500);
  }

  for (const item of orderItems) {
    const product = productMap.get(item.product_id);
    if (product) await supabaseAdmin.from("products").update({ count_in_stock: product.count_in_stock - item.qty }).eq("id", item.product_id);
  }

  if (paymentMethod === "cod") {
    sendOrderConfirmationEmail({ ...order, order_items: orderItems }, user.email).catch(console.error);
    sendAdminNewOrderAlert(order).catch(console.error);
    return successResponse({ order, requiresPayment: false });
  }

  try {
    const razorpay = getRazorpayClient();
    const rpOrder = await razorpay.orders.create({ amount: Math.round(totalPrice * 100), currency: "INR", receipt: order.order_number, notes: { internal_order_id: order.id } });
    await supabaseAdmin.from("orders").update({ razorpay_order_id: rpOrder.id }).eq("id", order.id);
    return successResponse({ order, requiresPayment: true, razorpay: { orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID } });
  } catch {
    return errorResponse("Payment gateway error. Check Razorpay keys.", 503);
  }
}

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  const { data, error } = await supabaseAdmin.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return errorResponse("Could not load orders", 500);
  return successResponse({ orders: data });
}

