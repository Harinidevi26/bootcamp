-- ============================================================
-- Migration: 001_initial_schema.sql
-- Run this in: Supabase Dashboard → SQL Editor
-- Or via: supabase db push (if using the Supabase CLI)
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- provides gen_random_uuid()

-- ─── 1. products ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url   TEXT        NOT NULL DEFAULT '',
  category    TEXT        NOT NULL DEFAULT '',
  stock       INT         NOT NULL DEFAULT 0 CHECK (stock >= 0),
  slug        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. cart_items ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,          -- Firebase Auth UID (string)
  product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  quantity    INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. orders ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  total_amount         NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_name        TEXT        NOT NULL DEFAULT '',
  shipping_address     TEXT        NOT NULL DEFAULT '',
  shipping_city        TEXT        NOT NULL DEFAULT '',
  shipping_postal_code TEXT        NOT NULL DEFAULT '',
  shipping_phone       TEXT        NOT NULL DEFAULT '',
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. order_items ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES orders   (id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity    INT         NOT NULL CHECK (quantity > 0),
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0)   -- snapshot at purchase time
);

-- ─── Row Level Security ────────────────────────────────────────────────────────

-- products: publicly readable, no writes from the client
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- products — anyone can SELECT
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);

-- cart_items — users can only see / modify their own rows
CREATE POLICY "cart_items_owner_select"
  ON cart_items FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "cart_items_owner_insert"
  ON cart_items FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "cart_items_owner_update"
  ON cart_items FOR UPDATE
  USING  (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "cart_items_owner_delete"
  ON cart_items FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- orders — users can only see their own orders
CREATE POLICY "orders_owner_select"
  ON orders FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "orders_owner_insert"
  ON orders FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- order_items — readable when the parent order belongs to the user
CREATE POLICY "order_items_owner_select"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "order_items_owner_insert"
  ON order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_slug        ON products    (slug);
CREATE INDEX IF NOT EXISTS idx_products_category    ON products    (category);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id   ON cart_items  (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON orders      (user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- ─── Seed: 8 realistic products ───────────────────────────────────────────────
-- Prices in USD. UUIDs are stable so re-running is idempotent (ON CONFLICT DO NOTHING).

INSERT INTO products (id, name, description, price, image_url, category, stock, slug)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'Wireless Noise-Cancelling Headphones',
    'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res Audio certification.',
    79.99,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    'Electronics',
    45,
    'wireless-noise-cancelling-headphones'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Minimalist Leather Watch',
    'Slim Japanese quartz movement, genuine leather strap, and sapphire-coated glass for everyday elegance.',
    129.99,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    'Accessories',
    20,
    'minimalist-leather-watch'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Premium Running Sneakers',
    'Lightweight mesh upper with responsive foam midsole. Engineered for long-distance comfort and speed.',
    94.99,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    'Footwear',
    60,
    'premium-running-sneakers'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Portable Bluetooth Speaker',
    '360° surround sound, IPX7 waterproof rating, and 20-hour playtime in a rugged yet compact build.',
    49.99,
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
    'Electronics',
    80,
    'portable-bluetooth-speaker'
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Smart Fitness Tracker',
    '24/7 heart-rate monitoring, sleep tracking, GPS, and a 7-day battery in a feather-light band.',
    59.99,
    'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80',
    'Electronics',
    35,
    'smart-fitness-tracker'
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    'Canvas Backpack',
    'Waxed canvas shell with a padded 15″ laptop sleeve, YKK zips, and leather accent details.',
    44.99,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    'Bags',
    50,
    'canvas-backpack'
  ),
  (
    'a1000000-0000-0000-0000-000000000007',
    'Ceramic Coffee Mug',
    'Hand-thrown stoneware mug with a speckled glaze finish. Microwave and dishwasher safe. Holds 350 ml.',
    19.99,
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
    'Home & Kitchen',
    120,
    'ceramic-coffee-mug'
  ),
  (
    'a1000000-0000-0000-0000-000000000008',
    'Mechanical Keyboard',
    'TKL layout with Cherry MX Brown switches, per-key RGB backlighting, and aircraft-grade aluminium frame.',
    109.99,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
    'Electronics',
    25,
    'mechanical-keyboard'
  )
ON CONFLICT (id) DO NOTHING;
