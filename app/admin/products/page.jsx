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
  short_description: "",
  description: "",
  flavor: "",
  count_in_stock: "",
  net_weight: "",
  sku: "",
  gi_value: "",
  is_low_gi: false,
  is_gluten_free: false,
  is_vegan: false,
  is_featured: false,
};

// Field definitions for the "Add Product" form, driving both layout and state keys.
const PRODUCT_FORM_FIELDS = [
  { key: "name", label: "Name", type: "text", required: true, span: 2 },
  { key: "sku", label: "Product Code", type: "text", placeholder: "e.g., WIN-ONION-50G" },
  { key: "flavor", label: "Flavor", type: "text", placeholder: "e.g., Onion" },
  { key: "price", label: "Price (₹)", type: "number", step: "0.01", required: true },
  { key: "original_price", label: "Original Price (₹)", type: "number", step: "0.01" },
  { key: "count_in_stock", label: "Stock Quantity", type: "number", required: true },
  { key: "net_weight", label: "Net Weight", type: "text", placeholder: "e.g., 50g or 100g" },
  { key: "gi_value", label: "GI Value", type: "number", placeholder: "e.g., 55" },
  { key: "image", label: "Image Path", type: "text", span: 2, placeholder: "/images/product-onion.jpg" },
  { key: "short_description", label: "Short Description", type: "text", span: 2, placeholder: "Brief product tagline" },
];

// Checkbox fields for product attributes
const CHECKBOX_FIELDS = [
  { key: "is_low_gi", label: "Low GI" },
  { key: "is_gluten_free", label: "Gluten Free" },
  { key: "is_vegan", label: "Vegan" },
  { key: "is_featured", label: "Featured Product" },
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
  const setCheckbox = (key) => (e) => onChange({ ...form, [key]: e.target.checked });

  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={onSubmit}>
      <div className={styles.formGrid}>
        {PRODUCT_FORM_FIELDS.map(({ key, label, type, required, span, placeholder, step }) => (
          <label key={key} className={`${styles.field} ${span ? styles[`span${span}`] : ""}`}>
            {label}
            <input
              className={styles.input}
              type={type}
              step={step}
              value={form[key]}
              onChange={setField(key)}
              required={required}
              placeholder={placeholder}
            />
          </label>
        ))}
        
        {/* Checkboxes for product attributes */}
        <div className={styles.span4} style={{ display: "flex", gap: "20px", alignItems: "center", padding: "10px 0" }}>
          {CHECKBOX_FIELDS.map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form[key]}
                onChange={setCheckbox(key)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px", fontWeight: 600 }}>{label}</span>
            </label>
          ))}
        </div>
        
        <label className={`${styles.field} ${styles.span4}`}>
          Description
          <textarea
            className={styles.textarea}
            rows={4}
            value={form.description}
            onChange={setField("description")}
            placeholder="Detailed product description"
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
      <td style={{ fontWeight: 600 }}>{product.name}</td>
      <td style={{ fontSize: "13px", color: "var(--coco-light)" }}>{product.flavor || "—"}</td>
      <td style={{ fontSize: "13px", color: "var(--coco-light)" }}>{product.sku || "—"}</td>
      <td>
        <input
          className={styles.input}
          style={{ width: 90 }}
          type="number"
          step="0.01"
          defaultValue={product.price || 0}
          onBlur={(e) => {
            const newPrice = Number(e.target.value);
            if (newPrice !== product.price && newPrice > 0) {
              onUpdate(product, { price: newPrice });
            }
          }}
        />
      </td>
      <td>
        <input
          className={styles.input}
          style={{ width: 80 }}
          type="number"
          defaultValue={product.count_in_stock || 0}
          onBlur={(e) => onUpdate(product, { count_in_stock: Number(e.target.value) })}
        />
      </td>
      <td style={{ textAlign: "center" }}>
        {product.is_featured ? (
          <span className={styles.badge} style={{ padding: "4px 8px", fontSize: "14px", background: "var(--gold)", color: "var(--coco)" }}>★</span>
        ) : (
          <span style={{ color: "var(--coco-faint)" }}>—</span>
        )}
      </td>
      <td>
        <span className={styles.status}>{isInactive ? "inactive" : "active"}</span>
      </td>
      <td>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{ fontSize: "13px", padding: "6px 12px", minHeight: "32px" }}
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
            <th>Flavor</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Featured</th>
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
              <td colSpan="8">No products found.</td>
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