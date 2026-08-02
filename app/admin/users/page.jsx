"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

export default function AdminUsersPage() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => data.success ? setUsers(data.users) : toast.error(data.error || "Could not load users"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeRole = async (user, role) => {
    const res = await authFetch("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id: user.id, role }) });
    const data = await res.json();
    if (!data.success) {
      toast.error(data.error || "Could not update role");
      return;
    }
    toast.success("User role updated");
    load();
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Users</h1>
          <p className={styles.muted}>View customers and make trusted team members admins.</p>
        </div>
      </div>
      <section className={styles.panel}>
        {loading ? <div className={styles.empty}>Loading users...</div> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name || user.name || "-"}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td>
                      <select className={styles.select} value={user.role || "customer"} onChange={(e) => changeRole(user, e.target.value)}>
                        <option value="customer">customer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "-"}</td>
                  </tr>
                ))}
                {!users.length && <tr><td colSpan="5">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
