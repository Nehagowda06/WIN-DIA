"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLogOut, FiSave } from "react-icons/fi";
import StoreNav from "@/src/frontend/components/StoreNav";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../storefront.module.css";

function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
}

function ProfileForm({ profile, setProfile, saving, onSave }) {
  return (
    <form className={styles.panel} onSubmit={onSave}>
      <h3>Profile</h3>
      <label className={styles.field}>
        Full name
        <input
          value={profile.full_name}
          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
        />
      </label>
      <label className={styles.field}>
        Phone
        <input
          value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
      </label>
      <button className={styles.brownBtn} type="submit" disabled={saving}>
        <FiSave /> {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}

function OrdersPanel({ orders }) {
  return (
    <div className={styles.panel}>
      <h3>Recent Orders</h3>
      {!orders.length && (
        <p className={styles.muted}>No orders yet. Your checkout orders will appear here.</p>
      )}
      {orders.map((order) => (
        <Link className={styles.orderRow} href={`/order-confirmation?orderId=${order.id}`} key={order.id}>
          <span>
            <strong>{order.order_number || order.id}</strong>
            <br />
            <small>{order.order_status} · {order.payment_status}</small>
          </span>
          <strong>{formatCurrency(order.total_price)}</strong>
        </Link>
      ))}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, authFetch, logout } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/account");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    authFetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile({ full_name: d.profile.full_name || "", phone: d.profile.phone || "" });
        }
      })
      .catch(() => {});

    authFetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.orders || []);
      })
      .catch(() => {});
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await authFetch("/api/profile", { method: "PUT", body: JSON.stringify(profile) }).catch(() => {});
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading || !user) {
    return (
      <main className={styles.shell}>
        <StoreNav />
        <section className={styles.section}>Loading account...</section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <div>
            <h2>My Account</h2>
            <p className={styles.muted}>{user.email}</p>
          </div>
          <button className={styles.ghost} onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>

        <div className={styles.accountGrid}>
          <ProfileForm profile={profile} setProfile={setProfile} saving={saving} onSave={handleSave} />
          <OrdersPanel orders={orders} />
        </div>
      </section>
    </main>
  );
}