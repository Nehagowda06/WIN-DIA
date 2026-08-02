"use client";
import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLogIn } from "react-icons/fi";
import StoreNav from "@/src/frontend/components/StoreNav";
import { supabase } from "@/src/frontend/lib/supabase";
import styles from "../storefront.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push(next);
  };

  return (
    <main className={styles.shell}>
      <StoreNav />
      <form className={styles.formWrap} onSubmit={submit}>
        <h1>Login</h1>
        <p className={styles.muted}>Access checkout, saved addresses, wishlist, and orders.</p>
        <label className={styles.field}>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className={styles.field}>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.brownBtn} type="submit" disabled={loading}>
          <FiLogIn /> {loading ? "Logging in..." : "Login"}
        </button>
        <p className={styles.muted} style={{ marginTop: 16 }}>
          New here? <Link href="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.shell}><StoreNav /><section className={styles.section}>Loading login...</section></main>}>
      <LoginForm />
    </Suspense>
  );
}
