/**
 * GET /api/products
 *
 * Query params:
 *   ?search=<string>   — case-insensitive substring match on `name`
 *   ?category=<string> — case-insensitive exact match on `category`
 *
 * Data layer is intentionally isolated in `fetchProducts()`.
 * To swap to Supabase, replace only that function — the handler
 * and filtering logic stay the same.
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  slug: string;
}

// ─── In-memory seed data ───────────────────────────────────────────────────────
// Replace this constant with a real Supabase table read inside fetchProducts().

const SEED_PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "wireless-noise-cancelling-headphones",
    name: "Wireless Noise-Cancelling Headphones",
    description:
      "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res Audio certification.",
    price: 79.99,
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    category: "Electronics",
  },
  {
    id: "2",
    slug: "minimalist-leather-watch",
    name: "Minimalist Leather Watch",
    description:
      "Slim Japanese quartz movement, genuine leather strap, and sapphire-coated glass for everyday elegance.",
    price: 129.99,
    image_url:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    category: "Accessories",
  },
  {
    id: "3",
    slug: "premium-running-sneakers",
    name: "Premium Running Sneakers",
    description:
      "Lightweight mesh upper with responsive foam midsole. Engineered for long-distance comfort and speed.",
    price: 94.99,
    image_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    category: "Footwear",
  },
  {
    id: "4",
    slug: "portable-bluetooth-speaker",
    name: "Portable Bluetooth Speaker",
    description:
      "360° surround sound, IPX7 waterproof rating, and 20-hour playtime in a rugged yet compact build.",
    price: 49.99,
    image_url:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
    category: "Electronics",
  },
  {
    id: "5",
    slug: "smart-fitness-tracker",
    name: "Smart Fitness Tracker",
    description:
      "24/7 heart-rate monitoring, sleep tracking, GPS, and a 7-day battery in a feather-light band.",
    price: 59.99,
    image_url:
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80",
    category: "Electronics",
  },
  {
    id: "6",
    slug: "canvas-backpack",
    name: "Canvas Backpack",
    description:
      "Waxed canvas shell with a padded 15″ laptop sleeve, YKK zips, and leather accent details.",
    price: 44.99,
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    category: "Bags",
  },
  {
    id: "7",
    slug: "ceramic-coffee-mug",
    name: "Ceramic Coffee Mug",
    description:
      "Hand-thrown stoneware mug with a speckled glaze finish. Microwave and dishwasher safe.",
    price: 19.99,
    image_url:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
    category: "Home & Kitchen",
  },
  {
    id: "8",
    slug: "mechanical-keyboard",
    name: "Mechanical Keyboard",
    description:
      "TKL layout with Cherry MX Brown switches, per-key RGB backlighting, and aircraft-grade aluminium frame.",
    price: 109.99,
    image_url:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    category: "Electronics",
  },
];

// ─── Data layer ────────────────────────────────────────────────────────────────
// TODO: Replace with a Supabase query when the database is ready.
//
//   import { createClient } from "@/lib/supabase";
//   const supabase = createClient();
//   const { data, error } = await supabase.from("products").select("*");
//   if (error) throw error;
//   return data as Product[];

async function fetchProducts(): Promise<Product[]> {
  // Simulate an async data source (remove the next line when using Supabase).
  return SEED_PRODUCTS;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.toLowerCase().trim() ?? "";
    const category = searchParams.get("category")?.toLowerCase().trim() ?? "";

    let products = await fetchProducts();

    if (search) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(search)
      );
    }

    if (category) {
      products = products.filter(
        (p) => p.category.toLowerCase() === category
      );
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
