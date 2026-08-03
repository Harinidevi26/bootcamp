"use client";

import { useState, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuthState } from "@/lib/firebase";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_phone: string;
}

type FieldErrors = Partial<Record<keyof FormFields, string>>;

/**
 * Tracks the post-popup outcome so the page can render the right UI panel.
 *
 * idle        — initial state / form visible
 * verifying   — verify-razorpay-payment call in flight
 * success     — payment verified; brief success screen before redirect
 * verify_fail — verification returned an error (Try Again shown)
 * dismissed   — user closed popup or payment failed; status still pending
 */
type PaymentState =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "verify_fail"; message: string }
  | { kind: "dismissed"; orderId: string; razorpayOrderId: string; amount: number };

const EMPTY_FORM: FormFields = {
  shipping_name: "",
  shipping_address: "",
  shipping_city: "",
  shipping_postal_code: "",
  shipping_phone: "",
};

const FIELD_LABELS: Record<keyof FormFields, string> = {
  shipping_name: "Full name",
  shipping_address: "Street address",
  shipping_city: "City",
  shipping_postal_code: "Postal code",
  shipping_phone: "Phone number",
};

// ─── Razorpay window type ─────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(fields: FormFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.shipping_name.trim())
    errors.shipping_name = "Full name is required.";

  if (!fields.shipping_address.trim())
    errors.shipping_address = "Street address is required.";

  if (!fields.shipping_city.trim())
    errors.shipping_city = "City is required.";

  if (!fields.shipping_postal_code.trim())
    errors.shipping_postal_code = "Postal code is required.";
  else if (!/^[A-Z0-9][A-Z0-9\s\-]{2,9}$/i.test(fields.shipping_postal_code.trim()))
    errors.shipping_postal_code = "Enter a valid postal code.";

  if (!fields.shipping_phone.trim())
    errors.shipping_phone = "Phone number is required.";
  else if (!/^\+?[\d\s\-()]{7,20}$/.test(fields.shipping_phone.trim()))
    errors.shipping_phone = "Enter a valid phone number.";

  return errors;
}

// ─── Inline field error ───────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-error"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </span>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────

function FormField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
}: {
  id: keyof FormFields;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const hasError = Boolean(error);
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1.5 text-sm font-medium text-foreground">
        {label}
        <span className="ml-0.5 text-error" aria-hidden="true">*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`
          rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground
          placeholder:text-muted transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary/40
          ${hasError
            ? "border-error focus:border-error focus:ring-error/30"
            : "border-border focus:border-primary"
          }
        `}
      />
      <span id={`${id}-error`}>
        <FieldError message={error} />
      </span>
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary() {
  const { items, subtotal, loading } = useCart();

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-lg bg-muted/20 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-muted/20" />
              <div className="h-3 w-1/4 rounded bg-muted/20" />
            </div>
            <div className="h-4 w-12 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center text-muted">
        <ShoppingBag className="h-10 w-10 text-muted/50" aria-hidden="true" />
        <p className="text-sm">Your cart is empty.</p>
      </div>
    );
  }

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div>
      <ul className="divide-y divide-border" aria-label="Order items">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            {item.product?.image_url && (
              <img
                src={item.product.image_url}
                alt={item.product.name}
                className="h-14 w-14 rounded-lg object-cover object-center border border-border shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.product?.name ?? "Unknown Product"}
              </p>
              <p className="text-xs text-muted">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Tax (10%)</span>
          <span>${(subtotal * 0.1).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-3 mt-3">
          <span>Total</span>
          <span>${(subtotal * 1.1).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Razorpay script loader ───────────────────────────────────────────────────

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script."));
    document.body.appendChild(script);
  });
}

// ─── Outcome panels ──────────────────────────────────────────────────────────

/** Shown while /api/verify-razorpay-payment is in flight */
function VerifyingPanel() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <Loader2
        className="h-14 w-14 animate-spin text-primary"
        aria-hidden="true"
      />
      <div>
        <p className="text-lg font-semibold text-foreground">Verifying payment…</p>
        <p className="mt-1 text-sm text-muted">Please wait, do not close this page.</p>
      </div>
    </div>
  );
}

/** Shown on successful verification before the redirect fires */
function SuccessPanel() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2
          className="h-10 w-10 text-success"
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">Payment successful!</p>
        <p className="mt-1 text-sm text-muted">Redirecting to your order…</p>
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-muted" aria-hidden="true" />
    </div>
  );
}

/** Shown when verify-razorpay-payment returns an error */
function VerifyFailPanel({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
        <XCircle className="h-10 w-10 text-error" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">Payment verification failed</p>
        <p className="mt-2 max-w-sm text-sm text-muted">{message}</p>
      </div>
      <button
        type="button"
        id="retry-after-verify-fail"
        onClick={onRetry}
        disabled={retrying}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {retrying ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        )}
        Try Again
      </button>
    </div>
  );
}

/** Shown when user closes popup or payment fails — order stays pending */
function DismissedPanel({
  onRetry,
  retrying,
}: {
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
        <AlertCircle className="h-10 w-10 text-accent" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">Payment was not completed</p>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Your order has been saved but payment was not received. You can try
          again — no new order will be created.
        </p>
      </div>
      <button
        type="button"
        id="retry-payment-popup"
        onClick={onRetry}
        disabled={retrying}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {retrying ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        )}
        Retry Payment
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthState();
  const { items, subtotal } = useCart();

  const [fields, setFields] = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Tracks where we are after the popup closes
  const [paymentState, setPaymentState] = useState<PaymentState>({ kind: "idle" });

  // True while checking order-status on dismiss / retrying popup
  const [retrying, setRetrying] = useState(false);

  const isBusy = submitting || razorpayLoading || retrying;

  function setField(key: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ── Core: open the Razorpay popup ─────────────────────────────────────────
  // Extracted so it can be called both on first attempt and on retry.
  const openRazorpayPopup = useCallback(
    async (
      orderId: string,
      razorpayOrderId: string,
      amount: number,
      customerEmail: string
    ) => {
      setRazorpayLoading(true);
      setServerError(null);

      try {
        await loadRazorpayScript();

        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!keyId) {
          setServerError("Payment configuration error. Contact support.");
          setRazorpayLoading(false);
          return;
        }

        await new Promise<void>((resolvePopup) => {
          const options: Record<string, unknown> = {
            key: keyId,
            order_id: razorpayOrderId,
            amount,
            currency: "INR",
            name: "MyStore",
            description: "Order payment",
            image: `${window.location.origin}/favicon.ico`,
            prefill: {
              name: fields.shipping_name,
              email: customerEmail,
              contact: fields.shipping_phone,
            },
            theme: {
              color:
                getComputedStyle(document.documentElement)
                  .getPropertyValue("--color-primary")
                  .trim() || "#6366f1",
            },

            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              // ── Verify the payment ──────────────────────────────────────────
              resolvePopup();
              setRazorpayLoading(false);
              setPaymentState({ kind: "verifying" });

              try {
                const verifyRes = await fetch("/api/verify-razorpay-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    order_id: orderId,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });

                const verifyJson = await verifyRes.json();

                if (!verifyRes.ok || !verifyJson.success) {
                  setPaymentState({
                    kind: "verify_fail",
                    message:
                      verifyJson.error ??
                      "Payment could not be verified. Please contact support.",
                  });
                  return;
                }

                // ── Success ─────────────────────────────────────────────────
                setPaymentState({ kind: "success" });
                // Short pause so the success screen is visible before redirect
                setTimeout(() => {
                  router.push(`/order-confirmation/${orderId}`);
                }, 1500);
              } catch {
                setPaymentState({
                  kind: "verify_fail",
                  message:
                    "Network error during verification. Your payment may have succeeded — check your email or contact support.",
                });
              }
            },

            modal: {
              ondismiss: async () => {
                resolvePopup();
                setRazorpayLoading(false);

                // Confirm the order is still pending before showing retry UI
                try {
                  const statusRes = await fetch(
                    `/api/order-status/${orderId}`
                  );
                  const statusJson = await statusRes.json();
                  const currentStatus: string = statusJson.status ?? "pending";

                  if (currentStatus === "paid" || currentStatus === "delivered") {
                    // Edge case: payment went through despite dismissed modal
                    setPaymentState({ kind: "success" });
                    setTimeout(() => {
                      router.push(`/order-confirmation/${orderId}`);
                    }, 1500);
                  } else {
                    // Still pending — offer retry on the same Razorpay order
                    setPaymentState({
                      kind: "dismissed",
                      orderId,
                      razorpayOrderId,
                      amount,
                    });
                  }
                } catch {
                  // Fallback: assume pending and let user retry
                  setPaymentState({
                    kind: "dismissed",
                    orderId,
                    razorpayOrderId,
                    amount,
                  });
                }
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        });
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : "Payment initialisation failed. Please try again."
        );
        setRazorpayLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields.shipping_name, fields.shipping_phone, router]
  );

  // ── Retry: reopen popup for the same pending order ──────────────────────
  async function handleRetryPopup(
    orderId: string,
    razorpayOrderId: string,
    amount: number
  ) {
    setRetrying(true);
    setPaymentState({ kind: "idle" });
    setRetrying(false);
    await openRazorpayPopup(
      orderId,
      razorpayOrderId,
      amount,
      user?.email ?? ""
    );
  }

  // ── First submit: create orders then open popup ──────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    setPaymentState({ kind: "idle" });

    const fieldErrors = validate(fields);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      document.getElementById(Object.keys(fieldErrors)[0])?.focus();
      return;
    }

    if (!user) {
      setServerError("You must be signed in to place an order.");
      return;
    }

    if (items.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    // ── Step 1: Create Supabase order ────────────────────────────────────────
    setSubmitting(true);
    let orderId: string;
    try {
      const orderItems = items
        .filter((i) => i.product !== null)
        .map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.product!.price,
        }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uid, ...fields, items: orderItems }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      orderId = json.data?.orderId;
      if (!orderId) {
        setServerError("Order created but no ID returned. Contact support.");
        return;
      }
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      return;
    } finally {
      setSubmitting(false);
    }

    // ── Step 2: Create Razorpay order ────────────────────────────────────────
    setRazorpayLoading(true);
    let razorpayOrderId: string;
    let amount: number;
    try {
      const rzpRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      const rzpJson = await rzpRes.json();

      if (!rzpRes.ok) {
        setServerError(
          rzpJson.error ?? "Failed to initialise payment. Please try again."
        );
        setRazorpayLoading(false);
        return;
      }

      razorpayOrderId = rzpJson.razorpay_order_id;
      amount = rzpJson.amount;
    } catch {
      setServerError("Network error while creating payment. Please try again.");
      setRazorpayLoading(false);
      return;
    }

    setRazorpayLoading(false);

    // ── Step 3 → 5: Script + popup + verify (inside openRazorpayPopup) ──────
    await openRazorpayPopup(orderId, razorpayOrderId, amount, user.email ?? "");
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <ShoppingBag className="h-16 w-16 text-muted/50" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">Sign in to check out</h1>
        <p className="text-sm text-muted">
          You need to be signed in to place an order.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to home
        </Link>
      </div>
    );
  }

  // ── Outcome screens (replace the entire page content) ─────────────────────
  if (paymentState.kind === "verifying") {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <VerifyingPanel />
        </main>
      </div>
    );
  }

  if (paymentState.kind === "success") {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <SuccessPanel />
        </main>
      </div>
    );
  }

  if (paymentState.kind === "verify_fail") {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <VerifyFailPanel
            message={paymentState.message}
            retrying={isBusy}
            onRetry={() => setPaymentState({ kind: "idle" })}
          />
        </main>
      </div>
    );
  }

  if (paymentState.kind === "dismissed") {
    const { orderId, razorpayOrderId, amount } = paymentState;
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <DismissedPanel
            retrying={isBusy}
            onRetry={() => handleRetryPopup(orderId, razorpayOrderId, amount)}
          />
        </main>
      </div>
    );
  }

  // ── Normal checkout form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* Razorpay script-loading overlay */}
      {razorpayLoading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-10 py-8 shadow-xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Opening secure payment…
            </p>
            <p className="text-xs text-muted">Do not close or refresh this page.</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">

          {/* ── Shipping form ── */}
          <section aria-label="Shipping information">
            <h2 className="mb-6 text-xl font-bold text-foreground">
              Shipping details
            </h2>

            {serverError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {serverError}
              </div>
            )}

            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
            >
              <FormField
                id="shipping_name"
                label={FIELD_LABELS.shipping_name}
                value={fields.shipping_name}
                onChange={(v) => setField("shipping_name", v)}
                error={errors.shipping_name}
                autoComplete="name"
                placeholder="Jane Smith"
              />
              <FormField
                id="shipping_address"
                label={FIELD_LABELS.shipping_address}
                value={fields.shipping_address}
                onChange={(v) => setField("shipping_address", v)}
                error={errors.shipping_address}
                autoComplete="street-address"
                placeholder="123 Main Street, Apt 4B"
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  id="shipping_city"
                  label={FIELD_LABELS.shipping_city}
                  value={fields.shipping_city}
                  onChange={(v) => setField("shipping_city", v)}
                  error={errors.shipping_city}
                  autoComplete="address-level2"
                  placeholder="Chennai"
                />
                <FormField
                  id="shipping_postal_code"
                  label={FIELD_LABELS.shipping_postal_code}
                  value={fields.shipping_postal_code}
                  onChange={(v) => setField("shipping_postal_code", v)}
                  error={errors.shipping_postal_code}
                  autoComplete="postal-code"
                  placeholder="600001"
                />
              </div>
              <FormField
                id="shipping_phone"
                label={FIELD_LABELS.shipping_phone}
                value={fields.shipping_phone}
                onChange={(v) => setField("shipping_phone", v)}
                error={errors.shipping_phone}
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
              />

              <button
                type="submit"
                form="checkout-form"
                disabled={isBusy || items.length === 0}
                className="
                  mt-2 flex w-full items-center justify-center gap-2 rounded-xl
                  bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground
                  transition-opacity hover:opacity-90 focus:outline-none
                  focus:ring-2 focus:ring-primary/40
                  disabled:cursor-not-allowed disabled:opacity-50
                "
                aria-busy={isBusy}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Placing order…
                  </>
                ) : razorpayLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Opening payment…
                  </>
                ) : (
                  <>Pay · ${(subtotal * 1.1).toFixed(2)}</>
                )}
              </button>
            </form>
          </section>

          {/* ── Order summary ── */}
          <aside aria-label="Order summary">
            <div className="sticky top-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-5 text-base font-semibold text-foreground">
                Order summary
              </h2>
              <OrderSummary />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// ─── Shared page header ───────────────────────────────────────────────────────

function PageHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
            aria-label="Back to cart"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Cart
          </Link>
          <span className="text-muted">/</span>
          <h1 className="text-lg font-semibold text-foreground">Checkout</h1>
        </div>
      </div>
    </header>
  );
}
