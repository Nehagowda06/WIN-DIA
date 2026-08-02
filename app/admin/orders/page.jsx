"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const STATUSES = ["placed", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

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
      .then((data) => data.success ? setOrders(data.orders) : toast.error(data.error || "Could not load orders"))
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
    const headers = ["Order", "Date", "Total", "Payment", "Status", "Items"];
    const rows = orders.map((o) => [o.order_number || o.id, o.created_at, o.total_price, o.payment_status, o.order_status, o.order_items?.length || 0]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `windia-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Orders</h1>
          <p className={styles.muted}>Update order status and export order data.</p>
        </div>
        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={exportCsv} disabled={!orders.length}>Export CSV</button>
      </div>

      <div className={styles.toolbar}>
        <select className={styles.select} style={{ maxWidth: 240 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <section className={styles.panel}>
        {loading ? <div className={styles.empty}>Loading orders...</div> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number || order.id}<br /><span className={styles.muted}>{new Date(order.created_at).toLocaleString("en-IN")}</span></td>
                    <td>{order.order_items?.length || 0}</td>
                    <td>₹{Number(order.total_price || 0).toFixed(0)}</td>
                    <td><span className={styles.status}>{order.payment_status || "pending"}</span></td>
                    <td>
                      <select className={styles.select} value={order.order_status || "placed"} disabled={busyId === order.id} onChange={(e) => updateStatus(order, e.target.value)}>
                        {STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan="5">No orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
