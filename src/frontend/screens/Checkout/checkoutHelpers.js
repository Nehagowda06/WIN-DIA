export const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
export const LOCAL_ADDRESS_KEY = "checkoutAddress";

export function loadRazorpay() {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`)) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT; s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// Keeps a copy of the just-placed order for the confirmation page. Guests have
// no session, so they can't fetch the order from the (authenticated) API.
export function rememberOrder(order, patch = {}) {
  try {
    sessionStorage.setItem("lastOrder", JSON.stringify({ ...order, ...patch }));
  } catch {
    // Storage unavailable — confirmation page falls back to the API
  }
}

// Safe JSON reader: returns null instead of throwing when the body is empty or not JSON
export async function readJson(res) {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const STATES = ["Karnataka","Tamil Nadu","Kerala","Maharashtra","Delhi","Gujarat","Rajasthan","Uttar Pradesh","West Bengal","Telangana","Andhra Pradesh","Madhya Pradesh","Bihar","Punjab","Haryana","Odisha","Assam","Other"];
