-- ============================================================
-- WIN-DIA Seed Data: Categories + Products
-- ============================================================
-- NOTE: All prices, weights, and descriptions are TEMPORARY TEST DATA.
-- Final pricing, pack size, and product copy are TBD by business.
-- Replace with confirmed values before production launch.
-- ============================================================

-- Ensure unique constraints exist for ON CONFLICT clauses
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique ON categories (slug);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON products (slug);

-- Categories
INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
VALUES
  ('Gluten-Free Range', 'gluten-free', 'Lighter, easy-to-digest options without compromising on taste and crunch.', true, now(), now()),
  ('Traditional Range', 'traditional', 'Wholesome ingredients, authentic flavors, and satisfying crunch for daily enjoyment.', true, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Products (6 existing frontend products)
-- Prices are PLACEHOLDER values for development/testing only. Final pricing TBD.
-- Descriptions and weights are also temporary test data carried over from frontend dev.
INSERT INTO products (
  name, slug, flavor, category_id, price, original_price,
  description, is_active, is_featured, count_in_stock,
  is_gluten_free, is_low_gi, is_vegan, net_weight, image,
  created_at, updated_at
) VALUES
  (
    'WIN-DIA FibreRich Jeera Thins',
    'jeera-thins',
    'Jeera',
    (SELECT id FROM categories WHERE slug = 'gluten-free'),
    640, -- TEMPORARY TEST PRICE
    NULL,
    'A crisp, fibre-rich snack with the mellow sweetness of roasted onion.',
    true, true, 100,
    true, true, true, '200g', '/images/products/gluten-free/jeera.png',
    now(), now()
  ),
  (
    'WIN-DIA FibreRich Methi Thins',
    'methi-thins',
    'Methi',
    (SELECT id FROM categories WHERE slug = 'gluten-free'),
    640, -- TEMPORARY TEST PRICE
    NULL,
    'A bold, savoury crunch layered with warm roasted garlic notes.',
    true, true, 100,
    true, true, true, '200g', '/images/products/gluten-free/methi.png',
    now(), now()
  ),
  (
    'WIN-DIA FibreRich Moringa Thins',
    'moringa-thins',
    'Moringa',
    (SELECT id FROM categories WHERE slug = 'gluten-free'),
    640, -- TEMPORARY TEST PRICE
    NULL,
    'A fragrant, savoury bite finished with aromatic curry leaf.',
    true, true, 100,
    true, true, true, '200g', '/images/products/gluten-free/moringa.png',
    now(), now()
  ),
  (
    'WIN-DIA FibreRich Onion Thins',
    'onion-thins',
    'Onion',
    (SELECT id FROM categories WHERE slug = 'traditional'),
    640, -- TEMPORARY TEST PRICE
    NULL,
    'A satisfying daily crunch with naturally savoury onion flavour.',
    true, true, 100,
    false, true, true, '200g', '/images/products/everyday/onion.png',
    now(), now()
  ),
  (
    'WIN-DIA FibreRich Garlic Thins',
    'garlic-thins',
    'Garlic',
    (SELECT id FROM categories WHERE slug = 'traditional'),
    640, -- TEMPORARY TEST PRICE
    NULL,
    'A comforting garlic-forward snack for everyday moments.',
    true, true, 100,
    false, true, true, '200g', '/images/products/everyday/garlic.png',
    now(), now()
  ),
  (
    'WIN-DIA FibreRich Curry Leaf Thins',
    'curry-leaf-thins',
    'Curry Leaf',
    (SELECT id FROM categories WHERE slug = 'traditional'),
    640, -- TEMPORARY TEST PRICE
    NULL,
    'A light, flavourful crunch with a herbaceous curry leaf finish.',
    true, true, 100,
    false, true, true, '200g', '/images/products/everyday/curryleaf.png',
    now(), now()
  )
ON CONFLICT (slug) DO NOTHING;
