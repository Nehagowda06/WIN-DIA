"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUserPlus } from "react-icons/fi";
import StoreNav from "@/src/frontend/components/StoreNav";
import { supabase } from "@/src/frontend/lib/supabase";
import styles from "../storefront.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const token = data.session?.access_token;
    if (token) {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: form.full_name, phone: form.phone }),
      }).catch(() => {});
      router.push("/account");
      return;
    }

    setLoading(false);
    setMessage("Account created. Please check your email to confirm, then login.");
  };

  return (
    <main className={styles.shell}>
      <StoreNav />
      <form className={styles.formWrap} onSubmit={submit}>
        <h1>Create Account</h1>
        <p className={styles.muted}>Make checkout and order tracking work end-to-end.</p>
        <label className={styles.field}>Full name
          <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
        </label>
        <label className={styles.field}>Email
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        </label>
        <label className={styles.field}>Phone
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10-digit mobile" />
        </label>
        <label className={styles.field}>Password
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.muted}>{message}</p>}
        <button className={styles.brownBtn} type="submit" disabled={loading}>
          <FiUserPlus /> {loading ? "Creating..." : "Register"}
        </button>
        <p className={styles.muted} style={{ marginTop: 16 }}>
          Already registered? <Link href="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
