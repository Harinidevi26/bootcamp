/**
 * app/api/verify-razorpay-payment/route.ts
 *
 * POST /api/verify-razorpay-payment
 *
 * Request body:
 *   { order_id?: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
 *
 * Responses:
 *   200 { success: true }                      — signature valid, Razorpay payment verified, order marked paid
 *   400 { error: string }                      — signature mismatch or invalid payment state (no DB write)
 *   500 { error: string }                      — server/DB error
 */

import { NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabase-server";
import { razorpay } from "@/lib/razorpay";
import type { Order } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse & validate the incoming payload ─────────────────────────────
    const body = await request.json();
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      body as {
        order_id?: string;
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

    // ── 2. Recompute & check HMAC-SHA256 signature ───────────────────────────
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

    // ── 3. Fetch payment details from Razorpay to verify status ──────────────
    try {
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

      if (paymentDetails.order_id !== razorpay_order_id) {
        console.warn(
          "[verify-razorpay-payment] Razorpay payment order mismatch:",
          paymentDetails.order_id,
          "vs expected",
          razorpay_order_id
        );
        return Response.json(
          { error: "Payment does not match the expected Razorpay order." },
          { status: 400 }
        );
      }

      if (paymentDetails.status !== "captured" && paymentDetails.status !== "authorized") {
        console.warn(
          "[verify-razorpay-payment] Razorpay payment status is not captured/authorized:",
          paymentDetails.status
        );
        return Response.json(
          { error: `Payment status is ${paymentDetails.status}, expected captured or authorized.` },
          { status: 400 }
        );
      }
    } catch (razorpayErr) {
      console.error(
        "[verify-razorpay-payment] Error fetching payment from Razorpay SDK:",
        razorpayErr
      );
      return Response.json(
        { error: "Unable to verify payment with Razorpay server." },
        { status: 500 }
      );
    }

    // ── 4. Mark the order as paid in Supabase & ensure row was updated ────────
    let updatedRows: Array<{ id: string; status: string }> | null = null;
    let updateError: unknown = null;

    if (order_id) {
      // Primary attempt by Supabase order UUID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (supabaseServer as any)
        .from("orders")
        .update({
          status: "paid",
          razorpay_payment_id,
        } as Partial<Order>)
        .eq("id", order_id)
        .select("id, status");

      updatedRows = res.data;
      updateError = res.error;
    }

    // Fallback attempt by razorpay_order_id if primary update matched 0 rows
    if (!updatedRows || updatedRows.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallbackRes = await (supabaseServer as any)
        .from("orders")
        .update({
          status: "paid",
          razorpay_payment_id,
        } as Partial<Order>)
        .eq("razorpay_order_id", razorpay_order_id)
        .select("id, status");

      updatedRows = fallbackRes.data;
      updateError = fallbackRes.error;
    }

    if (updateError || !updatedRows || updatedRows.length === 0) {
      console.error(
        "[verify-razorpay-payment] Failed to update order status to paid:",
        updateError ?? "No matching order row found in database."
      );
      return Response.json(
        { error: "Payment verified but failed to update order status." },
        { status: 500 }
      );
    }

    // ── 5. Return success ────────────────────────────────────────────────────
    return Response.json({ success: true });
  } catch (err) {
    console.error("[verify-razorpay-payment] Unexpected error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
