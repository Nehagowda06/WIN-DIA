"use client";

/**
 * TEMPORARY — delete this file (and app/api/admin/test-email/route.ts) after
 * email template testing is complete.
 *
 * Access: /admin/test-email
 * Looks up WIN-1794547895953 in Supabase and sends both emails using its
 * real tracking_token and order_items.
 */

import { useState } from "react";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const ORDER_NUMBER = "WIN-1794547895953";

function ResultLine({ label, result }) {
  if (!result) return null;
  const sent = result.sent === true;
  const color = sent ? "#2d6a2d" : "#a33";
  const icon  = sent ? "✓" : "✗";
  return (
    <p style={{ margin: "6px 0", color, fontSize: 14 }}>
      <strong>{icon} {label}:</strong>{" "}
      {sent ? "sent" : `failed — ${result.reason ?? "unknown"}`}
    </p>
  );
}

export default function TestEmailPage() {
  const { authFetch } = useAuth();
  const [status,   setStatus]   = useState("idle");
  const [results,  setResults]  = useState(null);
  const [token,    setToken]    = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSend() {
    setStatus("sending");
    setResults(null);
    setToken(null);
    setErrorMsg("");

    try {
      const res  = await authFetch("/api/admin/test-email", {
        method: "POST",
        body: JSON.stringify({ orderNumber: ORDER_NUMBER }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data?.error?.message ?? data?.message ?? `HTTP ${res.status}`);
        setStatus("error");
        return;
      }

      setResults(data.results);
      setToken(data.trackingToken);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message ?? "Network error");
      setStatus("error");
    }
  }

  const sending = status === "sending";

  return (
    <>
      <div className={styles.top}>
        <div>
          <h1 className={styles.topTitle}>Email Test</h1>
          <p className={styles.muted}>
            Fetches order <strong>{ORDER_NUMBER}</strong> from Supabase and sends both
            emails using its real <code>tracking_token</code> and order items.
            Customer confirmation goes to <strong>EMAIL_TEST_RECIPIENT</strong>.
          </p>
        </div>
      </div>

      <div className={styles.panel} style={{ maxWidth: 540, padding: 24 }}>
        <button
          className={styles.button}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? "Sending…" : "Send test emails"}
        </button>

        {status === "done" && results && (
          <div style={{ marginTop: 20 }}>
            <ResultLine label="Customer confirmation" result={results.customerConfirmation} />
            <ResultLine label="Owner alert"           result={results.adminAlert} />
            {token && (
              <p style={{ marginTop: 12, fontSize: 13, color: "#555" }}>
                Token used: <code style={{ wordBreak: "break-all" }}>{token}</code>
              </p>
            )}
          </div>
        )}

        {status === "error" && (
          <p style={{ marginTop: 16, color: "#a33", fontSize: 14 }}>
            <strong>✗ Error:</strong> {errorMsg}
          </p>
        )}
      </div>
    </>
  );
}
