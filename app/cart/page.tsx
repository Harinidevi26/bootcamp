"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuthState } from "@/lib/firebase";

export default function CartPage() {
  const { user, loading: authLoading } = useAuthState();
  const { items, loading: cartLoading, subtotal, updateQuantity, removeFromCart } = useCart();

  const isLoading = authLoading || cartLoading;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Shopping Cart
              </h1>
              <p className="mt-1 text-sm text-muted">
                Review your items before proceeding to checkout.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline self-start sm:self-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-surface p-8 text-center shadow-xs">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Your cart is empty
            </h2>
            <p className="max-w-md text-sm text-muted">
              Looks like you haven't added anything to your cart yet. Explore our product catalogue and discover great items!
            </p>
            <Link
              href="/products"
              className="
                mt-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl
                bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground
                transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40
              "
            >
              Browse Products
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
            {/* ── Cart Items List ── */}
            <section aria-label="Cart items" className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs">
                <ul className="divide-y divide-border" role="list">
                  {items.map((item) => {
                    const product = item.product;
                    const imageUrl = product?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80";
                    const price = product?.price ?? 0;
                    const itemTotal = price * item.quantity;

                    return (
                      <li
                        key={item.id}
                        className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* Image + Info */}
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={imageUrl}
                            alt={product?.name ?? "Product image"}
                            className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover object-center"
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={product ? `/products/${product.slug}` : "#"}
                              className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                            >
                              {product?.name ?? "Product"}
                            </Link>
                            <p className="mt-1 text-xs text-muted">
                              ${price.toFixed(2)} each
                            </p>
                            <p className="mt-1 text-sm font-bold text-foreground sm:hidden">
                              Subtotal: ${itemTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Actions: Quantity + Remove */}
                        <div className="flex items-center justify-between gap-6 sm:justify-end">
                          {/* Quantity control */}
                          <div className="flex items-center rounded-xl border border-border bg-background p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                              className="
                                flex h-9 w-9 items-center justify-center rounded-lg text-foreground
                                hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed
                                transition-colors
                              "
                            >
                              <Minus className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <span className="w-10 text-center text-sm font-semibold text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="
                                flex h-9 w-9 items-center justify-center rounded-lg text-foreground
                                hover:bg-surface transition-colors
                              "
                            >
                              <Plus className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>

                          {/* Item Subtotal (desktop) */}
                          <div className="hidden sm:block text-right w-24">
                            <span className="text-base font-bold text-foreground">
                              ${itemTotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Trash button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${product?.name ?? "item"} from cart`}
                            className="
                              flex h-10 w-10 items-center justify-center rounded-xl text-muted
                              hover:bg-error/10 hover:text-error transition-colors
                            "
                          >
                            <Trash2 className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            {/* ── Order Summary Sidebar ── */}
            <aside aria-label="Order summary">
              <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6 shadow-xs">
                <h2 className="text-lg font-bold text-foreground">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Estimated Tax (10%)</span>
                    <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="
                    mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl
                    bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground
                    transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40
                  "
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
