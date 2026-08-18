-- ═══════════════════════════════════════════════════════════════════════════════
-- SECURITY ADVISOR FIXES
-- Resolves Supabase Security Advisor warnings:
-- 1. Functions missing SET search_path = public (search_path injection risk)
-- 2. SECURITY DEFINER functions executable by anon/authenticated (privilege escalation)
--
-- All these functions are called exclusively via service_role (getAdminClient())
-- from the backend. No client-side role needs EXECUTE permission.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FIX SEARCH PATH: Add SET search_path = public to functions missing it
-- Prevents search_path injection attacks on SECURITY DEFINER functions.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER FUNCTION public.check_and_increment_rate_limit(text, text, integer, integer)
    SET search_path = public;

ALTER FUNCTION public.generate_order_number()
    SET search_path = public;

-- Trigger functions for updated_at columns (may have different names per project)
DO $$
BEGIN
    -- update_updated_at_column
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = public';
    END IF;

    -- handle_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE 'ALTER FUNCTION public.handle_updated_at() SET search_path = public';
    END IF;

    -- set_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE 'ALTER FUNCTION public.set_updated_at() SET search_path = public';
    END IF;

    -- handle_new_user (auth trigger)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public';
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. REVOKE EXECUTE: Remove anon/authenticated EXECUTE on SECURITY DEFINER functions
-- These are only called via service_role (backend getAdminClient()).
-- Without this fix, anyone with the public anon key can call these from browser.
-- ─────────────────────────────────────────────────────────────────────────────

-- Inventory functions — prevents anonymous stock manipulation
REVOKE EXECUTE ON FUNCTION public.atomic_deduct_stock(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.atomic_restore_stock(uuid, integer) FROM anon, authenticated;

-- Checkout transaction — prevents creating orders without payment
REVOKE EXECUTE ON FUNCTION public.create_checkout_order_transaction(uuid, jsonb, jsonb, jsonb, jsonb) FROM anon, authenticated;

-- Rate limiter — prevents manipulating rate limit state
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, text, integer, integer) FROM anon, authenticated;

-- Order number generator — only needed as column default or called by service_role
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon, authenticated;

-- Auth trigger — fires on auth.users INSERT, never called from client
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated';
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. VERIFY: Confirm service_role still has EXECUTE (it always does by default
-- as superuser/owner, but explicit GRANT ensures it)
-- ─────────────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.atomic_deduct_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.atomic_restore_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_checkout_order_transaction(uuid, jsonb, jsonb, jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;
