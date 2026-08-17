import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/frontend/lib/supabase/server";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { isAdmin } from "@/src/frontend/lib/security";
import AdminNav from "./AdminNav";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

// ---- Resolves the logged-in user and whether they're an admin ----
async function getAdminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, allowed: false };

  const allowed = await isAdmin(user.id, supabaseAdmin);
  return { user, allowed };
}

// ---- Shown when a logged-in user isn't an admin ----
function AccessDenied() {
  return (
    <main className={styles.shell}>
      <section className={styles.notice}>
        <h1>Admin access required</h1>
        <p className={styles.muted}>
          This account is logged in, but it is not marked as admin in the profiles table.
        </p>
        <a href="/" className={styles.action}>
          Go home
        </a>
      </section>
    </main>
  );
}

export default async function AdminLayout({ children }) {
  const { user, allowed } = await getAdminSession();

  if (!user) redirect("/login?next=/admin");
  if (!allowed) return <AccessDenied />;

  return (
    <main className={styles.adminShell}>
      <AdminNav email={user.email} />
      <section className={styles.adminContent}>{children}</section>
    </main>
  );
}