"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function formatStatusLabel(status) {
  return (status || "placed").replace(/_/g, " ");
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(0)}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Shipping Label Generator ───────────────────────────────────────────────

const COMPANY_INFO = {
  name: "WIN-DIA Foods",
  address: "Mysore, Karnataka",
  phone: "+91 9148339947",
  gstin: "GSTIN: 29XXXXX1234X1Z5",
};

function generateShippingLabel(order) {
  const addr = order.shipping_address || {};
  const orderDate = formatDate(order.created_at);
  const orderNumber = order.order_number || order.id;

  const labelHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Shipping Label - ${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; }
    .label { border: 2px solid #000; padding: 24px; max-width: 500px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 18px; margin-bottom: 4px; }
    .header p { font-size: 11px; color: #555; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 6px; }
    .address { font-size: 13px; line-height: 1.5; }
    .address .name { font-weight: bold; font-size: 14px; }
    .row { display: flex; justify-content: space-between; align-items: center; }
    .order-info { border-top: 1px dashed #999; padding-top: 12px; margin-top: 12px; }
    .order-info td { padding: 3px 8px; font-size: 12px; }
    .order-info th { padding: 3px 8px; font-size: 11px; text-align: left; color: #666; }
    .barcode { text-align: center; margin-top: 16px; font-family: monospace; font-size: 14px; letter-spacing: 3px; padding: 8px; border: 1px solid #ccc; }
    .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #999; }
    @media print { body { padding: 0; } .label { border: 2px solid #000; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <h1>WIN-DIA™ Foods</h1>
      <p>Shipping Label</p>
    </div>

    <div class="row">
      <div class="section" style="flex:1">
        <div class="section-title">From</div>
        <div class="address">
          <div class="name">${COMPANY_INFO.name}</div>
          <div>${COMPANY_INFO.address}</div>
          <div>Ph: ${COMPANY_INFO.phone}</div>
        </div>
      </div>
      <div class="section" style="flex:1">
        <div class="section-title">To</div>
        <div class="address">
          <div class="name">${addr.full_name || addr.name || "Customer"}</div>
          <div>${addr.address_line1 || addr.street || ""}</div>
          <div>${addr.city || ""}, ${addr.state || ""} — ${addr.pincode || ""}</div>
          <div>Ph: ${addr.phone || ""}</div>
        </div>
      </div>
    </div>

    <div class="order-info">
      <table width="100%">
        <tr>
          <th>Order #</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Payment</th>
        </tr>
        <tr>
          <td><strong>${orderNumber}</strong></td>
          <td>${orderDate}</td>
          <td><strong>${formatCurrency(order.total_price)}</strong></td>
          <td>${order.payment_method === "cod" ? "COD" : "Prepaid"}</td>
        </tr>
      </table>
    </div>

    <div class="barcode">${orderNumber}</div>
    <div class="footer">Handle with care • Keep dry • WIN-DIA Foods Pvt. Ltd.</div>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(labelHtml);
  printWindow.document.close();
}

// ─── Components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const colorMap = {
    placed: "#f59e0b",
    confirmed: "#3b82f6",
    processing: "#8b5cf6",
    shipped: "#06b6d4",
    delivered: "#10b981",
    cancelled: "#ef4444",
  };
  const color = colorMap[status] || "#6b7280";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "capitalize",
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

function StatusFilter({ filter, setFilter }) {
  return (
    <div className={styles.toolbar}>
      <select className={styles.select} style={{ maxWidth: 240 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All statuses</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {formatStatusLabel(status)}
          </option>
        ))}
      </select>
    </div>
  );
}

function OrderRow({ order }) {
  return (
    <tr>
      <td>
        <strong>{order.order_number || order.id}</strong>
        <br />
        <span className={styles.muted}>{formatDate(order.created_at)}</span>
      </td>
      <td>{formatCurrency(order.total_price)}</td>
      <td>
        <span className={styles.status}>{order.payment_status || "pending"}</span>
      </td>
      <td>
        <StatusBadge status={order.order_status || "placed"} />
      </td>
      <td>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{ fontSize: "12px", padding: "6px 12px" }}
          onClick={() => generateShippingLabel(order)}
        >
          📦 Download Label
        </button>
      </td>
    </tr>
  );
}

function OrdersTable({ orders, loading }) {
  if (loading) return <div className={styles.empty}>Loading orders...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Label</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
          {!orders.length && (
            <tr>
              <td colSpan="5">No orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch(`/api/admin/orders${filter ? `?status=${filter}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const items = data.data?.items || data.orders || data.data || [];
          setOrders(Array.isArray(items) ? items : []);
        } else {
          toast.error(data.error || "Could not load orders");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Orders</h1>
          <p className={styles.muted}>View orders and download shipping labels.</p>
        </div>
      </div>

      <StatusFilter filter={filter} setFilter={setFilter} />

      <section className={styles.panel}>
        <OrdersTable orders={orders} loading={loading} />
      </section>
    </>
  );
}
