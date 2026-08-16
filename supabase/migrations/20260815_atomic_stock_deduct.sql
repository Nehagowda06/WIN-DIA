-- Atomic stock deduction RPC to prevent race conditions.
-- Returns TRUE if stock was successfully decremented, FALSE if insufficient stock.
-- Uses UPDATE ... WHERE count_in_stock >= p_quantity to ensure atomicity.

CREATE OR REPLACE FUNCTION public.atomic_deduct_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows_affected INTEGER;
BEGIN
    UPDATE public.products
    SET count_in_stock = count_in_stock - p_quantity,
        updated_at = now()
    WHERE id = p_product_id
      AND count_in_stock >= p_quantity
      AND is_active = true;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected = 0 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- Atomic stock restore for cancellations
CREATE OR REPLACE FUNCTION public.atomic_restore_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET count_in_stock = count_in_stock + p_quantity,
        updated_at = now()
    WHERE id = p_product_id;

    RETURN TRUE;
END;
$$;
