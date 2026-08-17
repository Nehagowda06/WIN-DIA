-- Enable Row Level Security on carts, cart_items, and wishlists tables.
-- This prevents users from seeing other users' cart and wishlist data.

-- ═══════════════════════════════════════════════════════════════
-- CARTS TABLE
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cart
CREATE POLICY "Users can view own cart"
    ON public.carts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own cart
CREATE POLICY "Users can create own cart"
    ON public.carts FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own cart
CREATE POLICY "Users can update own cart"
    ON public.carts FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own cart
CREATE POLICY "Users can delete own cart"
    ON public.carts FOR DELETE
    USING (auth.uid() = user_id);

-- Service role (backend) bypasses RLS automatically

-- ═══════════════════════════════════════════════════════════════
-- CART_ITEMS TABLE
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Users can only see items in their own cart
CREATE POLICY "Users can view own cart items"
    ON public.cart_items FOR SELECT
    USING (
        cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
    );

-- Users can add items to their own cart
CREATE POLICY "Users can insert own cart items"
    ON public.cart_items FOR INSERT
    WITH CHECK (
        cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
    );

-- Users can update items in their own cart
CREATE POLICY "Users can update own cart items"
    ON public.cart_items FOR UPDATE
    USING (
        cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
    );

-- Users can delete items from their own cart
CREATE POLICY "Users can delete own cart items"
    ON public.cart_items FOR DELETE
    USING (
        cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
    );

-- ═══════════════════════════════════════════════════════════════
-- WISHLISTS TABLE
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wishlist
CREATE POLICY "Users can view own wishlist"
    ON public.wishlists FOR SELECT
    USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can insert own wishlist"
    ON public.wishlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own wishlist
CREATE POLICY "Users can update own wishlist"
    ON public.wishlists FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete from their own wishlist
CREATE POLICY "Users can delete own wishlist"
    ON public.wishlists FOR DELETE
    USING (auth.uid() = user_id);
