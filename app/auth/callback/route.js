import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Live site address. Used only in production, because some hosts show an
// internal address in request.url instead of the real domain.
const PROD_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://windiafoods.com';

// In development, redirect back to wherever the request came from (localhost).
function getSiteUrl(request) {
  if (process.env.NODE_ENV !== 'production') {
    return new URL(request.url).origin;
  }
  return PROD_SITE_URL;
}

export async function GET(request) {
  const SITE_URL = getSiteUrl(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next') ?? '/';

  // Allow only a local path, not a different website.
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const supabaseAdmin = createSupabaseAdminClient();

        await supabaseAdmin.from('profiles').upsert(
          {
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              '',
            avatar_url: user.user_metadata?.avatar_url || null,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      }

      return NextResponse.redirect(new URL(next, SITE_URL));
    }

    console.error('OAuth exchange error:', error.message);
  }

  return NextResponse.redirect(
    new URL('/login?error=auth_failed', SITE_URL)
  );
}