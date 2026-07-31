/**
 * /api/cart — Cart CRUD
 *
 * All operations read/write the `cart_items` table via Supabase.
 * Authentication is intentionally kept simple for now (user_id passed
 * as a query param or in the request body). A future step will replace
 * this with server-side session verification.
 *
 * Response shape (success):  { data: <payload> }
 * Response shape (error):    { error: "<message>" }
 *
 * ── Handlers ──────────────────────────────────────────────────────────────────
 *   GET    ?user_id=<uid>          → all cart_items for that user, with product info
 *   POST   { user_id, product_id, quantity }  → insert (or increment) a cart row
 *   PATCH  { id, quantity }        → update quantity of an existing cart row
 *   DELETE { id }                  → remove a cart row
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import type { CartItem } from "@/lib/supabase";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ─── GET /api/cart?user_id=<uid> ──────────────────────────────────────────────
// Returns all cart_items rows for the given user, joined with product details.

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id")?.trim();

  if (!userId) {
    return err("Missing required query param: user_id", 400);
  }

  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        product:products (
          id, name, price, image_url, slug, category, stock
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return ok(data ?? []);
  } catch (error) {
    console.error("[GET /api/cart]", error);
    return err("Failed to fetch cart.", 500);
  }
}

// ─── POST /api/cart ───────────────────────────────────────────────────────────
// Body: { user_id: string, product_id: string, quantity: number }
//
// If a row with the same (user_id, product_id) already exists the quantities
// are summed — prevents duplicate rows for the same product.

export async function POST(request: NextRequest) {
  let body: { user_id?: string; product_id?: string; quantity?: number };

  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { user_id, product_id, quantity } = body;

  if (!user_id || !product_id) {
    return err("Missing required fields: user_id, product_id", 400);
  }

  const qty = Number(quantity ?? 1);
  if (!Number.isInteger(qty) || qty < 1) {
    return err("quantity must be a positive integer.", 400);
  }

  try {
    const supabase = createSupabaseClient();

    // Check whether this product is already in the user's cart
    const { data: existing, error: selectError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      // Increment quantity on the existing row
      const { data, error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + qty })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return ok(data as CartItem, 200);
    }

    // Insert a new row
    const { data, error: insertError } = await supabase
      .from("cart_items")
      .insert({ user_id, product_id, quantity: qty })
      .select()
      .single();

    if (insertError) throw insertError;
    return ok(data as CartItem, 201);
  } catch (error) {
    console.error("[POST /api/cart]", error);
    return err("Failed to add item to cart.", 500);
  }
}

// ─── PATCH /api/cart ──────────────────────────────────────────────────────────
// Body: { id: string, quantity: number }
// Updates the quantity of an existing cart_items row.

export async function PATCH(request: NextRequest) {
  let body: { id?: string; quantity?: number };

  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { id, quantity } = body;

  if (!id) {
    return err("Missing required field: id", 400);
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    return err("quantity must be a positive integer.", 400);
  }

  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: qty })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return err("Cart item not found.", 404);
      throw error;
    }

    return ok(data as CartItem);
  } catch (error) {
    console.error("[PATCH /api/cart]", error);
    return err("Failed to update cart item.", 500);
  }
}

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
// Body: { id: string }
// Removes a single cart_items row by its primary key.

export async function DELETE(request: NextRequest) {
  let body: { id?: string };

  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { id } = body;

  if (!id) {
    return err("Missing required field: id", 400);
  }

  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return ok({ id, deleted: true });
  } catch (error) {
    console.error("[DELETE /api/cart]", error);
    return err("Failed to remove cart item.", 500);
  }
}
