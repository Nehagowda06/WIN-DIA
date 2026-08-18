-- ═══════════════════════════════════════════════════════════════════════════════
-- SECURITY ADVISOR FIXES (remaining items)
-- Fixes trigger functions that still allow anon/authenticated EXECUTE.
-- These are trigger functions — they fire automatically on table operations,
-- never called directly from client code.
-- ═══════════════════════════════════════════════════════════════════════════════

-- handle_new_user: auth trigger — fires on auth.users INSERT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated';
    END IF;
END $$;

-- handle_updated_at: trigger function for updated_at columns
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated;

-- set_updated_at: trigger function for updated_at columns
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;

-- update_updated_at_column: trigger function for updated_at columns
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Ensure service_role can still execute (triggers run as table owner, but explicit grant is safe)
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
