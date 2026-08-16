import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const supabaseAdmin = createSupabaseAdminClient();
        await supabaseAdmin.from('profiles').upsert(
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || null,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('OAuth exchange error:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}