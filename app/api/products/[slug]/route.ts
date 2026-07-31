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
// Keep a local copy of the placeholder product list.
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
// Easily swappable for a Supabase query later.
async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const products = SEED_PRODUCTS;
  const product = products.find((p) => p.slug === slug);
  return product || null;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await fetchProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error(`[GET /api/products/${(await params).slug}]`, error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}
