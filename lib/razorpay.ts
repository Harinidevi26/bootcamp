/**
 * lib/razorpay.ts
 *
 * Server-only Razorpay SDK singleton.
 *
 * ── Important ────────────────────────────────────────────────────────────────
 *   RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET have NO "NEXT_PUBLIC_" prefix.
 *   Next.js therefore strips them from every client bundle automatically —
 *   they will never be visible in the browser.
 *
 *   Import this module ONLY from Route Handlers or Server Actions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";

/**
 * Singleton Razorpay client.
 * Use this in Route Handlers that need to create orders, fetch payments, etc.
 */
export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});
