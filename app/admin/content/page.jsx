"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const EMPTY = { key: "", label: "", section: "Home", value: "" };

export default function AdminContentPage() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/content")
      .then((res) => res.json())
      .then((data) => data.success ? setItems(data.content) : toast.error(data.error || "Could not load content"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (item) => {
    const res = await authFetch("/api/admin/content", { method: "PUT", body: JSON.stringify(item) });
    const data = await res.json();
    if (!data.success) toast.error(data.error || "Could not save content");
    else {
      toast.success("Content saved");
      setForm(EMPTY);
      setShowForm(false);
      load();
    }
  };

  const remove = async (key) => {
    if (!confirm(`Delete ${key}?`)) return;
    const res = await authFetch(`/api/admin/content?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) toast.error(data.error || "Could not delete content");
    else load();
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Site Content</h1>
          <p className={styles.muted}>Store editable text fields for future dynamic pages.</p>
        </div>
        <button className={styles.button} onClick={() => setShowForm((value) => !value)}>{showForm ? "Close" : "+ New Field"}</button>
      </div>

      {showForm && (
        <form className={`${styles.panel} ${styles.form}`} onSubmit={(e) => { e.preventDefault(); save(form); }}>
          <div className={styles.formGrid}>
            <label className={styles.field}>Key<input className={styles.input} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="home.hero.title" required /></label>
            <label className={styles.field}>Section<input className={styles.input} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></label>
            <label className={`${styles.field} ${styles.span2}`}>Label<input className={styles.input} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
            <label className={`${styles.field} ${styles.span4}`}>Value<textarea className={styles.textarea} rows={3} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></label>
          </div>
          <button className={styles.button} style={{ marginTop: 14 }} type="submit">Save Field</button>
        </form>
      )}

      <section className={styles.panel}>
        {loading ? <div className={styles.empty}>Loading content...</div> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Section</th><th>Key</th><th>Value</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.key}>
                    <td>{item.section || "Custom"}</td>
                    <td>{item.key}</td>
                    <td>
                      <textarea className={styles.textarea} rows={2} value={item.value || ""} onChange={(e) => setItems((prev) => prev.map((entry) => entry.key === item.key ? { ...entry, value: e.target.value } : entry))} />
                    </td>
                    <td>
                      <button className={styles.button} onClick={() => save(item)}>Save</button>{" "}
                      <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => remove(item.key)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan="4">No editable content fields yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
