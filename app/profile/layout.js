import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/src/frontend/lib/supabase/server';
import { createSupabaseAdminClient } from '@/src/frontend/lib/supabase/admin';
import ProfileSidebar from '@/src/frontend/components/profile/ProfileSidebar';
import './profile.css';

export default async function ProfileLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="profile-page">
      <div className="profile-container">
        <ProfileSidebar profile={profile} />
        <main className="profile-content">{children}</main>
      </div>
    </div>
  );
}