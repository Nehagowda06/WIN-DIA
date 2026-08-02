import { supabase } from '@/src/frontend/lib/supabase/client';

export async function handleLogout(router) {
  await fetch('/api/auth/logout', { method: 'POST' });
  await supabase.auth.signOut();
  router.push('/goodbye');
}