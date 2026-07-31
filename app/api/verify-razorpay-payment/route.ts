/**
 * app/api/verify-razorpay-payment/route.ts
 *
 * POST /api/verify-razorpay-payment
 *
 * Request body:
 *   { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
 *
 * Responses:
 *   200 { success: true }                      — signature valid, order marked paid
 *   400 { error: "Invalid payment signature." } — signature mismatch (no DB write)
 *   500 { error: string }                       — unexpected server error
 */

import { NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabase-server";
import type { Order } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse & validate the incoming Razorpay callback payload ───────────
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      body as {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
      };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json(
        {
          error:
            "razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required.",
        },
        { status: 400 }
      );
    }

    // ── 2. Recompute the expected HMAC-SHA256 signature ──────────────────────
    //    Razorpay's canonical message is:  "<razorpay_order_id>|<razorpay_payment_id>"
    //    Key: RAZORPAY_KEY_SECRET (server-only — never sent to the browser)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error(
        "[verify-razorpay-payment] RAZORPAY_KEY_SECRET is not configured."
      );
      return Response.json({ error: "Internal server error." }, { status: 500 });
    }

    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(message)
      .digest("hex");

    // ── 3a. Signature mismatch — reject without touching the database ─────────
    if (expectedSignature !== razorpay_signature) {
      console.warn(
        "[verify-razorpay-payment] Signature mismatch for Razorpay order:",
        razorpay_order_id
      );
      return Response.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // ── 3b. Signature matches — mark the order as paid ───────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabaseServer as any)
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id,
      } as Partial<Order>)
      .eq("razorpay_order_id", razorpay_order_id);

    if (updateError) {
      console.error(
        "[verify-razorpay-payment] Failed to update order status:",
        updateError
      );
      return Response.json(
        { error: "Payment verified but failed to update order status." },
        { status: 500 }
      );
    }

    // ── 4. Return success ────────────────────────────────────────────────────
    return Response.json({ success: true });
  } catch (err) {
    console.error("[verify-razorpay-payment] Unexpected error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
