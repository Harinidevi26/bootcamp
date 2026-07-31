/**
 * POST /api/orders
 *
 * Creates a new order from the user's current cart.
 *
 * Request body:
 * {
 *   user_id:          string,
 *   shipping_name:    string,
 *   shipping_address: string,
 *   shipping_city:    string,
 *   shipping_postal_code: string,
 *   shipping_phone:   string,
 *   items: Array<{
 *     product_id: string,
 *     quantity:   number,
 *     price:      number,   // unit price snapshot at purchase time
 *   }>
 * }
 *
 * Steps:
 *   1. Validate the body.
 *   2. Compute total_amount = sum(price * quantity).
 *   3. Insert a row into `orders` (status = "pending").
 *   4. Insert one row per line item into `order_items`.
 *   5. Delete the user's `cart_items` rows.
 *   6. Return { orderId }.
 *
 * GET /api/orders — stub (order history endpoint, built later)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderLineItem {
  product_id: string;
  quantity:   number;
  price:      number;       // unit price at the time of purchase
}

interface CreateOrderBody {
  user_id:              string;
  shipping_name:        string;
  shipping_address:     string;
  shipping_city:        string;
  shipping_postal_code: string;
  shipping_phone:       string;
  items:                OrderLineItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Stub — full order-history endpoint will be added in a later step.

export async function GET() {
  return NextResponse.json({ orders: [] });
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Parse + validate body ──────────────────────────────────────────────────

  let body: CreateOrderBody;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const {
    user_id,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_postal_code,
    shipping_phone,
    items,
  } = body;

  if (!user_id) {
    return err("Missing required field: user_id", 400);
  }

  const missingShipping = [
    "shipping_name",
    "shipping_address",
    "shipping_city",
    "shipping_postal_code",
    "shipping_phone",
  ].filter((k) => !body[k as keyof CreateOrderBody]);

  if (missingShipping.length > 0) {
    return err(`Missing required shipping fields: ${missingShipping.join(", ")}`, 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    return err("items must be a non-empty array.", 400);
  }

  for (const item of items) {
    if (!item.product_id) return err("Each item must have a product_id.", 400);
    if (!Number.isInteger(item.quantity) || item.quantity < 1)
      return err("Each item.quantity must be a positive integer.", 400);
    if (typeof item.price !== "number" || item.price < 0)
      return err("Each item.price must be a non-negative number.", 400);
  }

  // 2. Compute total ──────────────────────────────────────────────────────────

  const total_amount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const supabase = createSupabaseClient();

  // 3. Insert order ───────────────────────────────────────────────────────────

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id,
      status:               "pending",
      total_amount,
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_phone,
      razorpay_order_id:   null,
      razorpay_payment_id: null,
    })
    .select("id")
    .single();

  if (orderError) {
    console.error("[POST /api/orders] insert order:", orderError);
    return err("Failed to create order.", 500);
  }

  const orderId: string = order.id;

  // 4. Insert order_items ─────────────────────────────────────────────────────

  const orderItemRows = items.map((item) => ({
    order_id:   orderId,
    product_id: item.product_id,
    quantity:   item.quantity,
    price:      item.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemRows);

  if (itemsError) {
    // Order is already committed — log the error but don't fail the response.
    // A background job / webhook can reconcile missing order_items if needed.
    console.error("[POST /api/orders] insert order_items:", itemsError);
  }

  // 5. Clear the user's cart ──────────────────────────────────────────────────

  const { error: cartError } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user_id);

  if (cartError) {
    // Non-fatal — the order is created. The cart will be stale until the user
    // refreshes, but data integrity is intact.
    console.error("[POST /api/orders] clear cart:", cartError);
  }

  // 6. Return the new order id ────────────────────────────────────────────────

  return ok({ orderId }, 201);
}
