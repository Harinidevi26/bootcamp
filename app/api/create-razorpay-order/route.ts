/**
 * app/api/create-razorpay-order/route.ts
 *
 * POST /api/create-razorpay-order
 *
 * Request body : { order_id: string }   ← our Supabase order UUID
 * Response     : { razorpay_order_id: string; amount: number }
 *                amount is in paise (INR × 100)
 */

import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { razorpay } from "@/lib/razorpay";
import type { Order } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse & validate the request body ────────────────────────────────
    const body = await request.json();
    const { order_id } = body as { order_id?: string };

    if (!order_id || typeof order_id !== "string") {
      return Response.json(
        { error: "order_id is required and must be a string." },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orderRow, error: fetchError } = await (supabaseServer as any)
      .from("orders")
      .select("total_amount")
      .eq("id", order_id)
      .single() as { data: Pick<Order, "total_amount"> | null; error: unknown };

    if (fetchError || !orderRow) {
      console.error("[create-razorpay-order] Supabase fetch error:", fetchError);
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    const totalAmount: number = orderRow.total_amount;

    if (typeof totalAmount !== "number" || totalAmount <= 0) {
      return Response.json(
        { error: "Order has an invalid total_amount." },
        { status: 422 }
      );
    }

    // ── 3. Create a Razorpay order (amount in paise = totalAmount × 100) ────
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      // receipt ties the Razorpay order back to our DB row (max 40 chars)
      receipt: order_id.slice(0, 40),
    });

    // ── 4. Persist the Razorpay order id onto our Supabase order row ─────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabaseServer as any)
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", order_id);

    if (updateError) {
      console.error(
        "[create-razorpay-order] Failed to save razorpay_order_id:",
        updateError
      );
      // Razorpay order already exists — surface error so the client can retry.
      return Response.json(
        { error: "Failed to save Razorpay order id." },
        { status: 500 }
      );
    }

    // ── 5. Return the Razorpay order id and amount to the frontend ───────────
    return Response.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount, // paise
    });
  } catch (err) {
    console.error("[create-razorpay-order] Unexpected error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
