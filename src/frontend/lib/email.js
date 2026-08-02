import nodemailer from "nodemailer";

let cachedTransporter = null;
function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  if (!cachedTransporter) cachedTransporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
  return cachedTransporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) { console.error(`Email not sent: "${subject}" to ${to}`); return { sent: false }; }
  try { await t.sendMail({ from: `"WIN-DIA" <${process.env.GMAIL_USER}>`, to, subject, html }); return { sent: true }; }
  catch (err) { console.error("Email error:", err.message); return { sent: false }; }
}

const money = (n) => `₹${Number(n).toFixed(2)}`;
const wrap = (inner) => `<div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:40px;background:#fff;border-radius:16px;border:1px solid #f0e6df"><h1 style="font-family:'Cormorant Garamond',serif;font-size:28px;color:#c56a3d;margin:0 0 24px">WIN·DIA</h1>${inner}<p style="color:#a89a92;font-size:12px;margin-top:32px;border-top:1px solid #f5ede6;padding-top:16px">Questions? Email care@windia.com</p></div>`;

export async function sendOrderConfirmationEmail(order, to) {
  if (!to) return;
  const items = (order.order_items || []).map((i) => `<tr><td style="padding:6px 0;color:#3a2a1e">${i.name} × ${i.qty}</td><td style="text-align:right;color:#3a2a1e">${money(i.price * i.qty)}</td></tr>`).join("");
  return sendMail({ to, subject: `Order Confirmed – #${order.order_number}`, html: wrap(`<p>Thanks for your order!</p><div style="background:#fff9f4;border-radius:12px;padding:20px;margin:16px 0"><strong>Order #${order.order_number}</strong></div><table style="width:100%;border-collapse:collapse">${items}</table><div style="border-top:2px solid #3a2a1e;padding-top:12px;margin-top:12px;font-weight:700">Total: ${money(order.total_price)}</div>`) });
}

export async function sendAdminNewOrderAlert(order) {
  const to = process.env.ADMIN_ALERT_EMAIL || process.env.GMAIL_USER;
  if (!to) return;
  return sendMail({ to, subject: `New order #${order.order_number} – ${money(order.total_price)}`, html: wrap(`<h2 style="font-family:'Cormorant Garamond',serif;font-size:24px;color:#3a2a1e">New Order</h2><p><strong>#${order.order_number}</strong> — ${money(order.total_price)}</p>`) });
}

export async function sendShippingUpdateEmail(order, to) {
  if (!to) return;
  return sendMail({ to, subject: `Order ${order.order_status} – #${order.order_number}`, html: wrap(`<p>Your order <strong>#${order.order_number}</strong> is now <strong>${order.order_status}</strong>.</p>${order.awb_code ? `<p>AWB: ${order.awb_code}</p>` : ""}`) });
}
