"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const EMPTY = { key: "", label: "", section: "Home", value: "" };

function ContentForm({ form, setForm, onSave }) {
  return (
    <form
      className={`${styles.panel} ${styles.form}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <div className={styles.formGrid}>
        <label className={styles.field}>
          Key
          <input
            className={styles.input}
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="home.hero.title"
            required
          />
        </label>
        <label className={styles.field}>
          Section
          <input
            className={styles.input}
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
          />
        </label>
        <label className={`${styles.field} ${styles.span2}`}>
          Label
          <input
            className={styles.input}
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </label>
        <label className={`${styles.field} ${styles.span4}`}>
          Value
          <textarea
            className={styles.textarea}
            rows={3}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            required
          />
        </label>
      </div>
      <button className={styles.button} style={{ marginTop: 14 }} type="submit">
        Save Field
      </button>
    </form>
  );
}

function ContentRow({ item, onValueChange, onSave, onDelete }) {
  return (
    <tr>
      <td>{item.section || "Custom"}</td>
      <td>{item.key}</td>
      <td>
        <textarea
          className={styles.textarea}
          rows={2}
          value={item.value || ""}
          onChange={(e) => onValueChange(item.key, e.target.value)}
        />
      </td>
      <td>
        <button className={styles.button} onClick={() => onSave(item)}>
          Save
        </button>{" "}
        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => onDelete(item.key)}>
          Delete
        </button>
      </td>
    </tr>
  );
}

function ContentTable({ items, loading, onValueChange, onSave, onDelete }) {
  if (loading) return <div className={styles.empty}>Loading content...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Section</th>
            <th>Key</th>
            <th>Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ContentRow
              key={item.key}
              item={item}
              onValueChange={onValueChange}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
          {!items.length && (
            <tr>
              <td colSpan="4">No editable content fields yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

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
      .then((data) => (data.success ? setItems(data.content) : toast.error(data.error || "Could not load content")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (item) => {
    const res = await authFetch("/api/admin/content", { method: "PUT", body: JSON.stringify(item) });
    const data = await res.json();
    if (!data.success) {
      toast.error(data.error || "Could not save content");
    } else {
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

  const handleValueChange = (key, value) => {
    setItems((prev) => prev.map((entry) => (entry.key === key ? { ...entry, value } : entry)));
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Site Content</h1>
          <p className={styles.muted}>Store editable text fields for future dynamic pages.</p>
        </div>
        <button className={styles.button} onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "+ New Field"}
        </button>
      </div>

      {showForm && <ContentForm form={form} setForm={setForm} onSave={save} />}

      <section className={styles.panel}>
        <ContentTable
          items={items}
          loading={loading}
          onValueChange={handleValueChange}
          onSave={save}
          onDelete={remove}
        />
      </section>
    </>
  );
}