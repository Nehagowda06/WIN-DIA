-- Migration: Add atomic checkout transaction RPC function
-- Ensures 100% database ACID compliance for checkout: order, items, payment, and shipment placeholder

CREATE OR REPLACE FUNCTION public.create_checkout_order_transaction(
    p_user_id UUID,
    p_order_data JSONB,
    p_order_items JSONB,
    p_payment_data JSONB,
    p_shipment_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_payment_id UUID;
    v_shipment_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_order_record public.orders%ROWTYPE;
    v_payment_record public.payments%ROWTYPE;
    v_shipment_record public.shipments%ROWTYPE;
BEGIN
    -- 1. Generate Order Number if not provided
    v_order_number := COALESCE(p_order_data->>'order_number', 'WIN-' || floor(extract(epoch from now()) * 1000)::text);

    -- 2. Insert Order
    INSERT INTO public.orders (
        order_number,
        user_id,
        status,
        payment_status,
        shipping_status,
        currency,
        subtotal_amount,
        discount_amount,
        tax_amount,
        shipping_amount,
        total_amount,
        coupon_code,
        shipping_address,
        billing_address,
        customer_notes,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        v_order_number,
        p_user_id,
        COALESCE(p_order_data->>'status', 'pending'),
        COALESCE(p_order_data->>'payment_status', 'pending'),
        COALESCE(p_order_data->>'shipping_status', 'unfulfilled'),
        COALESCE(p_order_data->>'currency', 'INR'),
        (p_order_data->>'subtotal_amount')::NUMERIC,
        (p_order_data->>'discount_amount')::NUMERIC,
        (p_order_data->>'tax_amount')::NUMERIC,
        (p_order_data->>'shipping_amount')::NUMERIC,
        (p_order_data->>'total_amount')::NUMERIC,
        p_order_data->>'coupon_code',
        COALESCE(p_order_data->'shipping_address', '{}'::jsonb),
        COALESCE(p_order_data->'billing_address', p_order_data->'shipping_address', '{}'::jsonb),
        p_order_data->>'customer_notes',
        COALESCE(p_order_data->'metadata', '{}'::jsonb),
        NOW(),
        NOW()
    ) RETURNING * INTO v_order_record;

    v_order_id := v_order_record.id;

    -- 3. Insert Order Status History Record
    INSERT INTO public.order_status_history (
        order_id,
        status,
        notes,
        created_by,
        created_at
    ) VALUES (
        v_order_id,
        v_order_record.status,
        'Order created atomically via RPC transaction',
        p_user_id::text,
        NOW()
    );

    -- 4. Insert Order Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            product_name,
            variant_name,
            sku,
            unit_price,
            quantity,
            total_price,
            price_snapshot,
            created_at
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'variant_id')::UUID,
            v_item->>'product_name',
            v_item->>'variant_name',
            v_item->>'sku',
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'total_price')::NUMERIC,
            COALESCE(v_item->'price_snapshot', '{}'::jsonb),
            NOW()
        );
    END LOOP;

    -- 5. Insert Payment Record
    INSERT INTO public.payments (
        order_id,
        payment_provider,
        transaction_id,
        provider_order_id,
        amount,
        currency,
        status,
        payment_method,
        raw_response,
        created_at,
        updated_at
    ) VALUES (
        v_order_id,
        COALESCE(p_payment_data->>'payment_provider', 'razorpay'),
        NULL,
        p_payment_data->>'provider_order_id',
        (p_payment_data->>'amount')::NUMERIC,
        COALESCE(p_payment_data->>'currency', 'INR'),
        COALESCE(p_payment_data->>'status', 'pending'),
        p_payment_data->>'payment_method',
        COALESCE(p_payment_data->'raw_response', '{}'::jsonb),
        NOW(),
        NOW()
    ) RETURNING * INTO v_payment_record;

    v_payment_id := v_payment_record.id;

    -- 6. Insert Shipment Placeholder
    INSERT INTO public.shipments (
        order_id,
        courier_name,
        tracking_number,
        shipping_label_url,
        status,
        shipped_at,
        delivered_at,
        created_at,
        updated_at
    ) VALUES (
        v_order_id,
        COALESCE(p_shipment_data->>'courier_name', 'NimbusPost'),
        NULL,
        NULL,
        COALESCE(p_shipment_data->>'status', 'pending'),
        NULL,
        NULL,
        NOW(),
        NOW()
    ) RETURNING * INTO v_shipment_record;

    v_shipment_id := v_shipment_record.id;

    -- Return full JSON payload of created entities
    RETURN jsonb_build_object(
        'order', row_to_json(v_order_record)::jsonb,
        'payment', row_to_json(v_payment_record)::jsonb,
        'shipment', row_to_json(v_shipment_record)::jsonb,
        'order_id', v_order_id,
        'order_number', v_order_number
    );
END;
$$;
