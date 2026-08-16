-- Migration: Rename cart_items.variant_id → cart_items.product_id
-- Adds FK constraint to products.id with ON DELETE CASCADE.
-- Safe to re-run (checks column/constraint existence before acting).

DO $$
BEGIN
  -- Step 1: Rename column only if variant_id still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cart_items'
      AND column_name = 'variant_id'
  ) THEN
    ALTER TABLE public.cart_items RENAME COLUMN variant_id TO product_id;
    RAISE NOTICE 'Renamed cart_items.variant_id → product_id';
  ELSE
    RAISE NOTICE 'Column cart_items.variant_id does not exist (already renamed or never existed). Skipping rename.';
  END IF;

  -- Step 2: Add foreign key only if it does not already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'cart_items'
      AND constraint_name = 'fk_cart_items_product'
  ) THEN
    ALTER TABLE public.cart_items
      ADD CONSTRAINT fk_cart_items_product
      FOREIGN KEY (product_id) REFERENCES public.products(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Added FK constraint fk_cart_items_product (cart_items.product_id → products.id)';
  ELSE
    RAISE NOTICE 'FK constraint fk_cart_items_product already exists. Skipping.';
  END IF;
END
$$;
