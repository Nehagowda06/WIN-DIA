import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin Dashboard | WIN-DIA",
};

async function loadStats() {
  const [
    ordersCount,
    pendingCount,
    productsCount,
    usersCount,
    paidOrders,
    recentOrders,
  ] = await Promise.all([
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).in("order_status", ["placed", "confirmed", "processing"]),
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("orders").select("total_price").eq("payment_status", "paid"),
    supabaseAdmin
      .from("orders")
      .select("id, order_number, total_price, payment_status, order_status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const revenue = (paidOrders.data || []).reduce((sum, order) => sum + Number(order.total_price || 0), 0);

  return {
    totalOrders: ordersCount.count || 0,
    pendingOrders: pendingCount.count || 0,
    totalProducts: productsCount.count || 0,
    totalUsers: usersCount.count || 0,
    revenue,
    recentOrders: recentOrders.data || [],
  };
}

function money(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

export default async function AdminDashboardPage() {
  const stats = await loadStats();

  return (
    <>
        <div className={styles.top}>
          <div>
            <h1>Admin Dashboard</h1>
            <p className={styles.muted}>Live overview from Supabase orders, products, and profiles.</p>
          </div>
          <span className={styles.badge}>Owner tools</span>
        </div>

        <div className={styles.grid}>
          <article className={styles.card}><div className={styles.value}>{stats.totalOrders}</div><div className={styles.label}>Orders</div></article>
          <article className={styles.card}><div className={styles.value}>{stats.pendingOrders}</div><div className={styles.label}>Pending</div></article>
          <article className={styles.card}><div className={styles.value}>{money(stats.revenue)}</div><div className={styles.label}>Paid Revenue</div></article>
          <article className={styles.card}><div className={styles.value}>{stats.totalProducts}</div><div className={styles.label}>Products</div></article>
          <article className={styles.card}><div className={styles.value}>{stats.totalUsers}</div><div className={styles.label}>Users</div></article>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Recent Orders</h2>
            <span className={styles.muted}>Newest 8</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number || order.id}</td>
                    <td>{order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "-"}</td>
                    <td>{money(order.total_price)}</td>
                    <td><span className={styles.status}>{order.payment_status || "pending"}</span></td>
                    <td><span className={styles.status}>{order.order_status || "placed"}</span></td>
                  </tr>
                ))}
                {stats.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="5">No orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
    </>
  );
}
