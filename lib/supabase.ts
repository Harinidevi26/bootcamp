/**
 * lib/supabase.ts
 *
 * Supabase browser client for Next.js (App Router / client components).
 *
 * ── What lives here ──────────────────────────────────────────────────────────
 *   • Database type definitions (mirrors the SQL schema exactly)
 *   • createSupabaseClient() — lazy singleton, safe for HMR
 *   • supabase — convenience default export (use this in most places)
 *
 * ── Config ───────────────────────────────────────────────────────────────────
 *   All values come from NEXT_PUBLIC_ environment variables.
 *   Copy .env.local.example → .env.local and fill in your Supabase project URL
 *   and anon/public key before running the dev server.
 *
 *   NEVER put the Supabase service-role key in NEXT_PUBLIC_ variables or
 *   client-side code — it bypasses Row Level Security.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient as _createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Database type definitions ────────────────────────────────────────────────
// Keep in sync with supabase/migrations/001_initial_schema.sql

export interface Product {
  id: string;               // uuid
  name: string;
  description: string;
  price: number;            // numeric
  image_url: string;
  category: string;
  stock: number;            // int
  slug: string;
  created_at: string;       // timestamptz (ISO string from JSON)
}

export interface CartItem {
  id: string;               // uuid
  user_id: string;          // Firebase uid
  product_id: string;       // uuid → products.id
  quantity: number;
  created_at: string;
}

export interface Order {
  id: string;               // uuid
  user_id: string;
  status: string;           // default 'pending'
  total_amount: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_phone: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;               // uuid
  order_id: string;         // uuid → orders.id
  product_id: string;       // uuid → products.id
  quantity: number;
  price: number;            // snapshot of price at purchase time
}

export interface Database {
  public: {
    Tables: {
      products:    { Row: Product;   Insert: Omit<Product,   "id" | "created_at">; Update: Partial<Omit<Product,   "id">>; };
      cart_items:  { Row: CartItem;  Insert: Omit<CartItem,  "id" | "created_at">; Update: Partial<Omit<CartItem,  "id">>; };
      orders:      { Row: Order;     Insert: Omit<Order,     "id" | "created_at">; Update: Partial<Omit<Order,     "id">>; };
      order_items: { Row: OrderItem; Insert: Omit<OrderItem, "id">;                Update: Partial<Omit<OrderItem, "id">>; };
    };
  };
}

// ─── Lazy singleton ───────────────────────────────────────────────────────────
// A single SupabaseClient is reused across the browser session.
// This is safe: @supabase/supabase-js manages connection pooling internally.

let _client: SupabaseClient<Database> | null = null;

/**
 * Returns the shared Supabase browser client.
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * Throws a descriptive error at runtime if either variable is missing,
 * so misconfiguration is caught early rather than silently failing.
 */
export function createSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[supabase] Missing environment variables.\n" +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  _client = _createClient<Database>(url, key);
  return _client;
}

// ─── Convenience export ───────────────────────────────────────────────────────
// Import this in most files:
//   import supabase from "@/lib/supabase";

const supabase = createSupabaseClient();
export default supabase;
