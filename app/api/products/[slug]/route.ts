/**
 * GET /api/products/[slug]
 *
 * Looks up a single product by its slug from the Supabase `products` table.
 * Returns 404 JSON if no matching row is found.
 *
 * Data layer is isolated in fetchProductBySlug() — the handler stays unchanged.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// Re-export the canonical Product type from lib/supabase (single source of truth).
export type { Product } from "@/lib/supabase";
import type { Product } from "@/lib/supabase";

// ─── Data layer ────────────────────────────────────────────────────────────────
// To revert to in-memory data, replace only the body of this function.

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single(); // returns one row or null; sets error.code = "PGRST116" when 0 rows

  // PGRST116 = "JSON object requested, multiple (or no) rows returned"
  // This is the expected "not found" case — treat it as null, not an error.
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Supabase error: ${error.message}`);
  }

  return data as Product;
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
