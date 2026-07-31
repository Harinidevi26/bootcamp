/**
 * app/api/order-status/[id]/route.ts
 *
 * GET /api/order-status/:id
 *
 * Returns the current status (and key Razorpay fields) for an order.
 * Used by the frontend to re-check or retry payment verification.
 *
 * Response (200):
 *   { id, status, razorpay_order_id, razorpay_payment_id }
 *
 * Response (404):
 *   { error: "Order not found." }
 *
 * Response (400):
 *   { error: "Order id is required." }
 */

import { NextRequest } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import type { Order } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "Order id is required." }, { status: 400 });
  }

  const supabase = createSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .select("id, status, razorpay_order_id, razorpay_payment_id")
    .eq("id", id)
    .single() as {
      data: Pick<Order, "id" | "status" | "razorpay_order_id" | "razorpay_payment_id"> | null;
      error: unknown;
    };

  if (error || !data) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json({
    id: data.id,
    status: data.status,
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
  });
}
