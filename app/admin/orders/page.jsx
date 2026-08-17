"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

function formatStatusLabel(status) {
  return status.replace(/_/g, " ");
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(0)}`;
}

function buildOrdersCsv(orders) {
  const headers = ["Order", "Date", "Total", "Payment", "Status", "Items"];
  const rows = orders.map((o) => [
    o.order_number || o.id,
    o.created_at,
    o.total_price,
    o.payment_status,
    o.order_status,
    o.order_items?.length || 0,
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadCsv(csv, filename) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

function OrderRow({ order, busyId, onUpdateStatus }) {
  return (
    <tr>
      <td>
        {order.order_number || order.id}
        <br />
        <span className={styles.muted}>{new Date(order.created_at).toLocaleString("en-IN")}</span>
      </td>
      <td>{order.order_items?.length || 0}</td>
      <td>{formatCurrency(order.total_price)}</td>
      <td>
        <span className={styles.status}>{order.payment_status || "pending"}</span>
      </td>
      <td>
        <select
          className={styles.select}
          value={order.order_status || "placed"}
          disabled={busyId === order.id}
          onChange={(e) => onUpdateStatus(order, e.target.value)}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function OrdersTable({ orders, loading, busyId, onUpdateStatus }) {
  if (loading) return <div className={styles.empty}>Loading orders...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} busyId={busyId} onUpdateStatus={onUpdateStatus} />
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

export default function AdminOrdersPage() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    authFetch(`/api/admin/orders${filter ? `?status=${filter}` : ""}`)
      .then((res) => res.json())
      .then((data) => (data.success ? setOrders(data.orders) : toast.error(data.error || "Could not load orders")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const updateStatus = async (order, order_status) => {
    setBusyId(order.id);
    const res = await authFetch("/api/admin/orders", {
      method: "PATCH",
      body: JSON.stringify({ id: order.id, order_status }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!data.success) {
      toast.error(data.error || "Could not update order");
      return;
    }
    toast.success("Order updated");
    load();
  };

  const exportCsv = () => {
    const csv = buildOrdersCsv(orders);
    downloadCsv(csv, `windia-orders-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Orders</h1>
          <p className={styles.muted}>Update order status and export order data.</p>
        </div>
        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={exportCsv} disabled={!orders.length}>
          Export CSV
        </button>
      </div>

      <StatusFilter filter={filter} setFilter={setFilter} />

      <section className={styles.panel}>
        <OrdersTable orders={orders} loading={loading} busyId={busyId} onUpdateStatus={updateStatus} />
      </section>
    </>
  );
}