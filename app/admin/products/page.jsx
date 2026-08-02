"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const EMPTY = { name: "", price: "", original_price: "", image: "", category: "Snacks", count_in_stock: "", net_weight: "", description: "" };

export default function AdminProductsPage() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => data.success ? setProducts(data.products) : toast.error(data.error || "Could not load products"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    const res = await authFetch("/api/admin/products", { method: "POST", body: JSON.stringify(form) });
    const data = await res.json();
    if (!data.success) {
      toast.error(data.error || "Could not save product");
      return;
    }
    toast.success("Product added");
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const update = async (product, patch) => {
    const res = await authFetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    const data = await res.json();
    if (!data.success) toast.error(data.error || "Could not update product");
    else load();
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Products</h1>
          <p className={styles.muted}>Add products, update stock, and hide/show products.</p>
        </div>
        <button className={styles.button} onClick={() => setShowForm((value) => !value)}>{showForm ? "Close" : "+ Add Product"}</button>
      </div>

      {showForm && (
        <form className={`${styles.panel} ${styles.form}`} onSubmit={save}>
          <div className={styles.formGrid}>
            <label className={`${styles.field} ${styles.span2}`}>Name<input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className={styles.field}>Price<input className={styles.input} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>
            <label className={styles.field}>Original Price<input className={styles.input} type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} /></label>
            <label className={styles.field}>Stock<input className={styles.input} type="number" value={form.count_in_stock} onChange={(e) => setForm({ ...form, count_in_stock: e.target.value })} required /></label>
            <label className={styles.field}>Net Weight (g)<input className={styles.input} type="number" value={form.net_weight} onChange={(e) => setForm({ ...form, net_weight: e.target.value })} /></label>
            <label className={`${styles.field} ${styles.span2}`}>Image URL<input className={styles.input} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/images/product-methi.jpg" /></label>
            <label className={styles.field}>Category<input className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
            <label className={`${styles.field} ${styles.span4}`}>Description<textarea className={styles.textarea} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          </div>
          <button className={styles.button} style={{ marginTop: 14 }} type="submit">Save Product</button>
        </form>
      )}

      <section className={styles.panel}>
        {loading ? <div className={styles.empty}>Loading products...</div> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>₹{Number(product.price || 0).toFixed(0)}</td>
                    <td><input className={styles.input} style={{ width: 90 }} type="number" defaultValue={product.count_in_stock || 0} onBlur={(e) => update(product, { count_in_stock: Number(e.target.value) })} /></td>
                    <td><span className={styles.status}>{product.is_active === false ? "inactive" : "active"}</span></td>
                    <td><button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => update(product, { is_active: product.is_active === false })}>{product.is_active === false ? "Activate" : "Deactivate"}</button></td>
                  </tr>
                ))}
                {!products.length && <tr><td colSpan="5">No products found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
