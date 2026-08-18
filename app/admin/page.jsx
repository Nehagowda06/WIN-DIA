import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin Dashboard | WIN-DIA",
};

const PENDING_ORDER_STATUSES = ["placed", "confirmed", "processing"];
const RECENT_ORDERS_LIMIT = 8;

// ---- Data: pulls all dashboard counts/aggregates in parallel ----
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
    supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("order_status", PENDING_ORDER_STATUSES),
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("orders").select("total_price").eq("payment_status", "paid"),
    supabaseAdmin
      .from("orders")
      .select("id, order_number, total_price, payment_status, order_status, created_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_ORDERS_LIMIT),
  ]);

  const revenue = (paidOrders.data || []).reduce(
    (sum, order) => sum + Number(order.total_price || 0),
    0
  );

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

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "-";
}

// ---- Single stat card ----
function StatCard({ value, label }) {
  return (
    <article className={styles.card}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </article>
  );
}

// ---- Stat cards row, derived from loaded stats ----
function StatsGrid({ stats }) {
  const cards = [
    { value: stats.totalOrders, label: "Orders" },
    { value: stats.pendingOrders, label: "Pending" },
    { value: money(stats.revenue), label: "Paid Revenue" },
    { value: stats.totalProducts, label: "Products" },
    { value: stats.totalUsers, label: "Users" },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

// ---- Recent orders row ----
function OrderRow({ order }) {
  return (
    <tr>
      <td>{order.order_number || order.id}</td>
      <td>{formatDate(order.created_at)}</td>
      <td>{money(order.total_price)}</td>
      <td>
        <span className={styles.status}>{order.payment_status || "pending"}</span>
      </td>
      <td>
        <span className={styles.status}>{order.order_status || "placed"}</span>
      </td>
    </tr>
  );
}

// ---- Recent orders panel ----
function RecentOrdersPanel({ orders }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Recent Orders</h2>
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
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="5">No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
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
      </div>

      <StatsGrid stats={stats} />
      <RecentOrdersPanel orders={stats.recentOrders} />
    </>
  );
}