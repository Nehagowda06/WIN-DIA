"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import "./orders.css";

// Matches the backend's STATUS_TRANSITIONS in order.service.ts — cancellation
// is only allowed before an order ships.
const CANCELLABLE_STATUSES = ["placed", "confirmed", "processing"];

function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
}

function formatDate(dateStr) {
  return dateStr
    ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";
}

function formatStatusLabel(status) {
  return (status || "placed").replace(/_/g, " ");
}

function StatusBadge({ status }) {
  const normalized = status || "placed";
  return (
    <span className={`order-status-badge order-status-${normalized}`}>
      {formatStatusLabel(normalized)}
    </span>
  );
}

export default function ProfileOrdersPage() {
  const { authFetch, user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = () => {
    setLoading(true);
    authFetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.orders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Wait for auth to finish resolving before fetching — otherwise this can
  // fire before the session token has loaded, sending an unauthenticated
  // request that silently fails and shows "No orders yet" even though the
  // order exists.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadOrders();
  }, [authLoading, user]);

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Cancel this order?")) return;
    setCancellingId(orderId);
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel", reason: "Cancelled by customer from profile page" }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Could not cancel order.");
        return;
      }
      loadOrders();
    } catch {
      alert("Could not cancel order. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading || loading) return null;

  return (
    <div>
      <div className="profile-details-header">
        <div>
          <h1 className="profile-title">Your orders</h1>
          <p className="profile-subtitle">Track and manage your orders</p>
        </div>
      </div>

      {!orders.length && <p className="orders-empty">No orders yet.</p>}

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card-top">
              <Link href={`/order-confirmation?orderId=${order.id}`} className="order-number-link">
                {order.order_number || order.id}
              </Link>
              <StatusBadge status={order.order_status} />
            </div>
            <p className="order-meta-line">
              {formatDate(order.created_at)} &nbsp;·&nbsp; Payment: {order.payment_status} &nbsp;·&nbsp; {formatCurrency(order.total_price)}
            </p>
            <div className="order-actions">
              <Link href={`/order-confirmation?orderId=${order.id}`} className="order-action-link">
                View details
              </Link>
              {CANCELLABLE_STATUSES.includes(order.order_status) && (
                <button
                  className="order-cancel-btn"
                  disabled={cancellingId === order.id}
                  onClick={() => handleCancelOrder(order.id)}
                >
                  {cancellingId === order.id ? "Cancelling..." : "Cancel order"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
