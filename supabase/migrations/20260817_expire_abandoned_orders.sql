-- Expire abandoned orders: auto-cancel orders stuck in 'placed' status
-- with 'pending' payment for longer than the configured timeout (default 30 minutes).
-- This prevents indefinite reservation of order slots and cleans up abandoned checkouts.
--
-- IMPORTANT: Stock is NOT restored here because stock is only deducted after
-- successful payment. Orders in 'placed' + 'pending payment' never had stock deducted.

CREATE OR REPLACE FUNCTION public.expire_abandoned_orders(
    p_timeout_minutes INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows_affected INTEGER;
BEGIN
    UPDATE public.orders
    SET order_status = 'cancelled',
        updated_at = now()
    WHERE order_status = 'placed'
      AND payment_status = 'pending'
      AND created_at < (now() - (p_timeout_minutes || ' minutes')::interval);

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    -- Log cancellations to order_status_history
    INSERT INTO public.order_status_history (order_id, status, created_at)
    SELECT id, 'cancelled', now()
    FROM public.orders
    WHERE order_status = 'cancelled'
      AND updated_at = now()
      AND created_at < (now() - (p_timeout_minutes || ' minutes')::interval);

    RETURN v_rows_affected;
END;
$$;

-- Optional: Create a pg_cron job to run every 10 minutes (requires pg_cron extension).
-- Uncomment the following if pg_cron is available in your Supabase project:
--
-- SELECT cron.schedule(
--     'expire-abandoned-orders',
--     '*/10 * * * *',
--     $$SELECT public.expire_abandoned_orders(30)$$
-- );
