-- Migration: Add rate_limits table for Supabase / PostgreSQL-backed Rate Limiting
-- Supports Vercel Serverless multi-instance deployments without in-memory state

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    route TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rate_limits_key_route_unique UNIQUE (key, route)
);

-- Index for ultra-fast lookup by (key, route)
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_route ON public.rate_limits (key, route);

-- Index for automatic expiration/cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits (expires_at);

-- Atomic PostgreSQL RPC function for safe rate limit incrementing & window evaluation
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
    p_key TEXT,
    p_route TEXT,
    p_max_requests INTEGER,
    p_window_seconds INTEGER
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_count INTEGER,
    remaining INTEGER,
    reset_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_expires_at TIMESTAMPTZ;
    v_record public.rate_limits%ROWTYPE;
BEGIN
    v_expires_at := v_now + (p_window_seconds || ' seconds')::INTERVAL;

    -- Upsert atomic counter using ON CONFLICT DO UPDATE
    INSERT INTO public.rate_limits (key, route, request_count, window_start, expires_at, created_at, updated_at)
    VALUES (p_key, p_route, 1, v_now, v_expires_at, v_now, v_now)
    ON CONFLICT (key, route) DO UPDATE
    SET 
        request_count = CASE 
            WHEN public.rate_limits.expires_at <= v_now THEN 1 
            ELSE public.rate_limits.request_count + 1 
        END,
        window_start = CASE 
            WHEN public.rate_limits.expires_at <= v_now THEN v_now 
            ELSE public.rate_limits.window_start 
        END,
        expires_at = CASE 
            WHEN public.rate_limits.expires_at <= v_now THEN v_expires_at 
            ELSE public.rate_limits.expires_at 
        END,
        updated_at = v_now
    RETURNING * INTO v_record;

    -- Opportunistic cleanup of expired keys (1% random chance per request to keep table lightweight)
    IF random() < 0.01 THEN
        DELETE FROM public.rate_limits WHERE expires_at < v_now;
    END IF;

    allowed := v_record.request_count <= p_max_requests;
    current_count := v_record.request_count;
    remaining := GREATEST(0, p_max_requests - v_record.request_count);
    reset_seconds := GREATEST(0, EXTRACT(EPOCH FROM (v_record.expires_at - v_now))::INTEGER);

    RETURN NEXT;
END;
$$;
