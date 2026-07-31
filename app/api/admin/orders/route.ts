/**
 * GET /api/admin/orders
 *
 * Returns every order (newest first) together with its order_items.
 * Shape: { orders: Array<Order & { order_items: OrderItem[] }> }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id,
        product_id,
        quantity,
        price
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data });
}
