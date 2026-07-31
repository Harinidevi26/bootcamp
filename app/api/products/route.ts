/**
 * GET /api/products
 *
 * Query params:
 *   ?search=<string>   — case-insensitive substring match on `name` (Supabase ilike)
 *   ?category=<string> — exact match on `category` (Supabase eq)
 *
 * Data layer is isolated in `fetchProducts()`.
 * All filtering is pushed to Supabase — no post-fetch JS filtering.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// Re-export the canonical Product type from lib/supabase (single source of truth).
export type { Product } from "@/lib/supabase";
import type { Product } from "@/lib/supabase";

// ─── Data layer ────────────────────────────────────────────────────────────────
// To revert to in-memory data, replace the body of this function only.

async function fetchProducts(search: string, category: string): Promise<Product[]> {
  const supabase = createSupabaseClient();

  // Start query — select all columns, order by created_at descending
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Push filters to the database — avoids fetching rows that will be discarded.
  if (search) {
    // ilike = case-insensitive LIKE; %search% = substring match
    query = query.ilike("name", `%${search}%`);
  }

  if (category) {
    // eq is case-sensitive in Postgres; category values are stored Title-cased
    // so we match exactly. The client already sends the value as stored.
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return (data ?? []) as Product[];
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    // Keep the raw (non-lowercased) category value so it matches Postgres exactly.
    const search   = searchParams.get("search")?.trim()   ?? "";
    const category = searchParams.get("category")?.trim() ?? "";

    const products = await fetchProducts(search, category);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
