"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const EMPTY = { code: "", discountPercent: "", minOrderValue: "", usageLimit: "", expiresAt: "" };

function formatMinOrder(value) {
  return value ? `₹${value}` : "-";
}

function formatUsage(timesUsed, usageLimit) {
  return `${timesUsed || 0}${usageLimit ? ` / ${usageLimit}` : ""}`;
}

function formatExpiry(expiresAt) {
  return expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN") : "-";
}

function CouponForm({ form, setForm, onSave }) {
  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={onSave}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          Code
          <input
            className={styles.input}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="WINDIA10"
            required
          />
        </label>
        <label className={styles.field}>
          Discount %
          <input
            className={styles.input}
            type="number"
            min="1"
            max="100"
            value={form.discountPercent}
            onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            required
          />
        </label>
        <label className={styles.field}>
          Minimum Order
          <input
            className={styles.input}
            type="number"
            value={form.minOrderValue}
            onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Usage Limit
          <input
            className={styles.input}
            type="number"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Expires On
          <input
            className={styles.input}
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
        </label>
      </div>
      <button className={styles.button} style={{ marginTop: 14 }} type="submit">
        Create Coupon
      </button>
    </form>
  );
}

function CouponRow({ coupon, onToggle }) {
  return (
    <tr>
      <td>
        <strong>{coupon.code}</strong>
      </td>
      <td>{coupon.discount_percent}%</td>
      <td>{formatMinOrder(coupon.min_order_value)}</td>
      <td>{formatUsage(coupon.times_used, coupon.usage_limit)}</td>
      <td>{formatExpiry(coupon.expires_at)}</td>
      <td>
        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => onToggle(coupon)}>
          {coupon.active ? "Active" : "Inactive"}
        </button>
      </td>
    </tr>
  );
}

function CouponsTable({ coupons, loading, onToggle }) {
  if (loading) return <div className={styles.empty}>Loading coupons...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Discount</th>
            <th>Min Order</th>
            <th>Used</th>
            <th>Expires</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <CouponRow key={coupon.id} coupon={coupon} onToggle={onToggle} />
          ))}
          {!coupons.length && (
            <tr>
              <td colSpan="6">No coupons found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminCouponsPage() {
  const { authFetch } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/coupons")
      .then((res) => res.json())
      .then((data) => (data.success ? setCoupons(data.coupons) : toast.error(data.error || "Could not load coupons")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    const res = await authFetch("/api/admin/coupons", { method: "POST", body: JSON.stringify(form) });
    const data = await res.json();
    if (!data.success) {
      toast.error(data.error || "Could not create coupon");
      return;
    }
    toast.success("Coupon created");
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const toggle = async (coupon) => {
    const res = await authFetch("/api/admin/coupons", {
      method: "PATCH",
      body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
    });
    const data = await res.json();
    if (!data.success) toast.error(data.error || "Could not update coupon");
    else load();
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Coupons</h1>
          <p className={styles.muted}>Create and disable discount codes.</p>
        </div>
        <button className={styles.button} onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "+ New Coupon"}
        </button>
      </div>

      {showForm && <CouponForm form={form} setForm={setForm} onSave={save} />}

      <section className={styles.panel}>
        <CouponsTable coupons={coupons} loading={loading} onToggle={toggle} />
      </section>
    </>
  );
}