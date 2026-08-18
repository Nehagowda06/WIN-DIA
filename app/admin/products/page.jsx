"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  original_price: "",
  image: "",
  category: "Snacks",
  count_in_stock: "",
  net_weight: "",
  description: "",
};

// Field definitions for the "Add Product" form, driving both layout and state keys.
const PRODUCT_FORM_FIELDS = [
  { key: "name", label: "Name", type: "text", required: true, span: 2 },
  { key: "price", label: "Price", type: "number", required: true },
  { key: "original_price", label: "Original Price", type: "number" },
  { key: "count_in_stock", label: "Stock", type: "number", required: true },
  { key: "net_weight", label: "Net Weight (g)", type: "number" },
  { key: "image", label: "Image URL", type: "text", span: 2, placeholder: "/images/product-methi.jpg" },
  { key: "category", label: "Category", type: "text" },
];

// ---- Data hook: encapsulates all product API calls (list / create / update) ----
function useAdminProducts() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(() => {
    setLoading(true);
    authFetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const items = data.data?.items || data.products || data.data || [];
          setProducts(Array.isArray(items) ? items : []);
        } else {
          toast.error(data.error || "Could not load products");
        }
      })
      .finally(() => setLoading(false));
  }, [authFetch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = useCallback(
    async (form) => {
      const res = await authFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Could not save product");
        return false;
      }
      toast.success("Product added");
      loadProducts();
      return true;
    },
    [authFetch, loadProducts]
  );

  const updateProduct = useCallback(
    async (product, patch) => {
      const res = await authFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.success) toast.error(data.error || "Could not update product");
      else loadProducts();
    },
    [authFetch, loadProducts]
  );

  return { products, loading, createProduct, updateProduct };
}

// ---- Add Product form ----
function ProductForm({ form, onChange, onSubmit }) {
  const setField = (key) => (e) => onChange({ ...form, [key]: e.target.value });

  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={onSubmit}>
      <div className={styles.formGrid}>
        {PRODUCT_FORM_FIELDS.map(({ key, label, type, required, span, placeholder }) => (
          <label key={key} className={`${styles.field} ${span ? styles[`span${span}`] : ""}`}>
            {label}
            <input
              className={styles.input}
              type={type}
              value={form[key]}
              onChange={setField(key)}
              required={required}
              placeholder={placeholder}
            />
          </label>
        ))}
        <label className={`${styles.field} ${styles.span4}`}>
          Description
          <textarea
            className={styles.textarea}
            rows={3}
            value={form.description}
            onChange={setField("description")}
          />
        </label>
      </div>
      <button className={styles.button} style={{ marginTop: 14 }} type="submit">
        Save Product
      </button>
    </form>
  );
}

// ---- Products table row ----
function ProductRow({ product, onUpdate }) {
  const isInactive = product.is_active === false;

  return (
    <tr>
      <td>{product.name}</td>
      <td>₹{Number(product.price || 0).toFixed(0)}</td>
      <td>
        <input
          className={styles.input}
          style={{ width: 90 }}
          type="number"
          defaultValue={product.count_in_stock || 0}
          onBlur={(e) => onUpdate(product, { count_in_stock: Number(e.target.value) })}
        />
      </td>
      <td>
        <span className={styles.status}>{isInactive ? "inactive" : "active"}</span>
      </td>
      <td>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => onUpdate(product, { is_active: isInactive })}
        >
          {isInactive ? "Activate" : "Deactivate"}
        </button>
      </td>
    </tr>
  );
}

// ---- Products table ----
function ProductsTable({ products, loading, onUpdate }) {
  if (loading) return <div className={styles.empty}>Loading products...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} onUpdate={onUpdate} />
          ))}
          {!products.length && (
            <tr>
              <td colSpan="5">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---- Page ----
export default function AdminProductsPage() {
  const { products, loading, createProduct, updateProduct } = useAdminProducts();
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await createProduct(form);
    if (ok) {
      setForm(EMPTY_PRODUCT);
      setShowForm(false);
    }
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Products</h1>
          <p className={styles.muted}>Add products, update stock, and hide/show products.</p>
        </div>
        <button className={styles.button} onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "+ Add Product"}
        </button>
      </div>

      {showForm && <ProductForm form={form} onChange={setForm} onSubmit={handleSubmit} />}

      <section className={styles.panel}>
        <ProductsTable products={products} loading={loading} onUpdate={updateProduct} />
      </section>
    </>
  );
}