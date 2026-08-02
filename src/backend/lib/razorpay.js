// Ported from windia-integrated-version3-main/src/lib/razorpay.js
// Change: removed Next.js dependency — pure Node.js crypto + Razorpay SDK

import Razorpay from "razorpay";
import crypto from "crypto";

let instance = null;

export function getRazorpayClient() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.startsWith("REPLACE_ME") || keySecret.startsWith("REPLACE_ME")) {
    throw new Error(
      "Razorpay is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file."
    );
  }

  if (!instance) instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return instance;
}

/** Verifies the HMAC signature Razorpay sends back after a successful payment. */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

/** Verifies the X-Razorpay-Signature header on incoming webhooks. */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || secret.startsWith("REPLACE_ME")) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
