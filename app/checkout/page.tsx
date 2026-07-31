"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ShoppingBag, Loader2, ArrowLeft, Package } from "lucide-react";
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
      <label
        htmlFor={id}
        className="mb-1.5 text-sm font-medium text-foreground"
      >
        {label}
        <span className="ml-0.5 text-error" aria-hidden="true">
          *
        </span>
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
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-3 mt-3">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
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
  const [serverError, setServerError] = useState<string | null>(null);

  function setField(key: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Clear the error for this field on user input
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    const fieldErrors = validate(fields);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      // Focus the first errored field
      const firstKey = Object.keys(fieldErrors)[0];
      document.getElementById(firstKey)?.focus();
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

    setSubmitting(true);
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
        body: JSON.stringify({
          user_id: user.uid,
          ...fields,
          items: orderItems,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      const orderId = json.data?.orderId;
      if (!orderId) {
        setServerError("Order created but no ID returned. Contact support.");
        return;
      }

      router.push(`/order-confirmation/${orderId}`);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Auth gate ──
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
        <p className="text-sm text-muted">You need to be signed in to place an order.</p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                disabled={submitting || items.length === 0}
                className="
                  mt-2 flex w-full items-center justify-center gap-2 rounded-xl
                  bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground
                  transition-opacity hover:opacity-90 focus:outline-none
                  focus:ring-2 focus:ring-primary/40
                  disabled:cursor-not-allowed disabled:opacity-50
                "
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Placing order…
                  </>
                ) : (
                  <>
                    Place order · ${(subtotal * 1.1).toFixed(2)}
                  </>
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
