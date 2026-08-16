import { supabase } from '@/src/frontend/lib/supabase/client';
import { clearCart } from '@/src/frontend/redux/slices/cartSlice';
import { clearWishlist } from '@/src/frontend/redux/slices/wishlistSlice';

export async function handleLogout(router, dispatch) {
  await fetch('/api/auth/logout', { method: 'POST' });
  await supabase.auth.signOut();
  dispatch(clearCart());
  dispatch(clearWishlist());
  router.push('/goodbye');
}