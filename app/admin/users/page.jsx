"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const ROLES = ["customer", "admin"];

// ---- Data hook: encapsulates all user API calls (list / role change) ----
function useAdminUsers() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(() => {
    setLoading(true);
    authFetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users);
        else toast.error(data.error || "Could not load users");
      })
      .finally(() => setLoading(false));
  }, [authFetch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeRole = useCallback(
    async (user, role) => {
      const res = await authFetch("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, role }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Could not update role");
        return;
      }
      toast.success("User role updated");
      loadUsers();
    },
    [authFetch, loadUsers]
  );

  return { users, loading, changeRole };
}

function formatJoinedDate(createdAt) {
  return createdAt ? new Date(createdAt).toLocaleDateString("en-IN") : "-";
}

// ---- Users table row ----
function UserRow({ user, onChangeRole }) {
  return (
    <tr>
      <td>{user.full_name || user.name || "-"}</td>
      <td>{user.email}</td>
      <td>{user.phone || "-"}</td>
      <td>
        <select
          className={styles.select}
          value={user.role || "customer"}
          onChange={(e) => onChangeRole(user, e.target.value)}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </td>
      <td>{formatJoinedDate(user.created_at)}</td>
    </tr>
  );
}

// ---- Users table ----
function UsersTable({ users, loading, onChangeRole }) {
  if (loading) return <div className={styles.empty}>Loading users...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} onChangeRole={onChangeRole} />
          ))}
          {!users.length && (
            <tr>
              <td colSpan="5">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---- Page ----
export default function AdminUsersPage() {
  const { users, loading, changeRole } = useAdminUsers();

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Users</h1>
          <p className={styles.muted}>View customers and make trusted team members admins.</p>
        </div>
      </div>
      <section className={styles.panel}>
        <UsersTable users={users} loading={loading} onChangeRole={changeRole} />
      </section>
    </>
  );
}