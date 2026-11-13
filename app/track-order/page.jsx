"use client";
import { useState } from "react";
import Link from "next/link";
import { FiCheckCircle, FiSearch, FiTruck, FiXCircle } from "react-icons/fi";

const COD_STEPS = ["placed", "confirmed", "shipped", "out_for_delivery", "delivered", "payment_collected"];
const COD_LABELS = {
  placed: "Order Placed", confirmed: "Confirmed", shipped: "Shipped",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", payment_collected: "Payment Collected",
};
const ONLINE_STEPS = ["placed", "paid", "shipped", "out_for_delivery", "delivered"];
const ONLINE_LABELS = {
  placed: "Order Placed", paid: "Payment Confirmed", shipped: "Shipped",
  out_for_delivery: "Out for Delivery", delivered: "Delivered",
};

const BROWN = "#3B1F0F";
const GOLD = "#C9A84C";
const MUTED = "#6B5948";

const card = {
  background: "#fff",
  border: "1px solid rgba(201,168,76,0.35)",
  borderRadius: 16,
  padding: "24px 20px",
  boxShadow: "0 6px 24px rgba(59,31,15,0.06)",
};
const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(59,31,15,0.25)",
  fontSize: 15,
  color: BROWN,
  background: "#fffdf8",
  boxSizing: "border-box",
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/track/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Something went wrong. Please try again.");
      else setResult(data);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  let steps = ONLINE_STEPS;
  let labels = ONLINE_LABELS;
  let statusIdx = 0;
  const cancelled = result?.orderStatus === "cancelled";

  if (result && !cancelled) {
    const isCOD = result.paymentMethod === "cod";
    steps = isCOD ? COD_STEPS : ONLINE_STEPS;
    labels = isCOD ? COD_LABELS : ONLINE_LABELS;

    let display = result.orderStatus;
    if (!isCOD && result.paymentStatus === "paid" && result.orderStatus === "placed") display = "paid";
    if (isCOD && result.orderStatus === "delivered" && result.paymentStatus === "cod_collected") display = "payment_collected";

    const baseIdx = steps.indexOf(display);
    const dtdcKey = !isCOD && result.step === "confirmed" ? "paid" : result.step;
    const dtdcIdx = result.step ? steps.indexOf(dtdcKey) : -1;
    statusIdx = Math.max(baseIdx, dtdcIdx, 0);
  }

  // Events come newest first, so the first one is the latest update.
  const lastUpdated = result?.events?.[0]?.time;

  return (
    <main style={{ minHeight: "100vh", background: "#FBF6EA", padding: "140px 16px 64px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <FiTruck size={36} style={{ color: GOLD }} />
          <h1 style={{ color: BROWN, margin: "8px 0 6px", fontSize: 30 }}>Track Your Order</h1>
          <p style={{ color: MUTED, margin: 0, fontSize: 15 }}>
            Enter your order number and the phone number you used at checkout.
          </p>
        </div>

        <form onSubmit={submit} style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ color: BROWN, fontWeight: 600, fontSize: 14 }}>
            Order number
            <input
              style={{ ...input, marginTop: 6, fontWeight: 400 }}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. WD-12345"
              autoComplete="off"
              required
            />
          </label>
          <label style={{ color: BROWN, fontWeight: 600, fontSize: 14 }}>
            Phone number
            <input
              style={{ ...input, marginTop: 6, fontWeight: 400 }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </label>
          {error && <p style={{ color: "#b91c1c", fontSize: 14, margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 18px", borderRadius: 10, border: "none", cursor: loading ? "default" : "pointer",
              background: BROWN, color: "#FBF6EA", fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1,
            }}
          >
            <FiSearch /> {loading ? "Checking..." : "Track Order"}
          </button>
          <p style={{ color: MUTED, fontSize: 12, margin: 0, textAlign: "center" }}>
            Have an account? <Link href="/profile/orders" style={{ color: GOLD, fontWeight: 600 }}>View your orders</Link>
          </p>
        </form>

        {result && (
          <div style={card}>
            <p style={{ color: MUTED, fontSize: 13, margin: "0 0 4px" }}>Order #{result.orderNumber}</p>

            {cancelled ? (
              <div style={{ padding: 20, background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 12, textAlign: "center" }}>
                <FiXCircle size={40} style={{ color: "#ef4444" }} />
                <h3 style={{ color: "#dc2626", margin: "8px 0" }}>Order Cancelled</h3>
                <p style={{ fontSize: 14, color: "#991b1b", margin: 0 }}>
                  This order has been cancelled. For assistance, please contact customer support.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 8px", justifyContent: "space-between", margin: "14px 0" }}>
                  {steps.map((s, i) => {
                    const done = i <= statusIdx;
                    return (
                      <div key={s} style={{ flex: "1 1 80px", textAlign: "center", minWidth: 72 }}>
                        <div
                          style={{
                            width: 34, height: 34, borderRadius: "50%", margin: "0 auto 6px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: done ? GOLD : "#efe7d3", color: done ? BROWN : MUTED,
                            fontWeight: 700, fontSize: 14,
                            boxShadow: i === statusIdx ? "0 0 0 4px rgba(201,168,76,0.3)" : "none",
                          }}
                        >
                          {i < statusIdx ? <FiCheckCircle /> : i + 1}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: done ? BROWN : MUTED, fontWeight: done ? 700 : 400 }}>
                          {labels[s]}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 12, paddingTop: 16, borderTop: "1px solid rgba(201,168,76,0.25)" }}>
                  <p style={{ fontWeight: 700, color: BROWN, margin: "0 0 4px" }}>Status: {result.label}</p>
                  {lastUpdated && (
                    <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Last updated: {lastUpdated}</p>
                  )}
                  {result.issue && (
                    <p style={{ color: "#b45309", fontSize: 13, margin: "8px 0 0" }}>
                      There is an issue with this delivery. Please contact customer support.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}