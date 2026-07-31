"use client";

import Image from "next/image";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function CartDrawer() {
  const { items, loading, subtotal, drawerOpen, closeDrawer, updateQuantity, removeFromCart } =
    useCart();

  if (!drawerOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeDrawer}
      />

      {/* ── Drawer panel ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="
          fixed right-0 top-0 z-50 flex h-full w-full flex-col
          bg-surface shadow-2xl
          sm:max-w-[400px]
        "
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold text-foreground">
              Your Cart
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted">
                  ({items.length} {items.length === 1 ? "item" : "items"})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="
              rounded-full p-1.5 text-muted
              hover:bg-primary/10 hover:text-primary
              transition-colors
            "
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-muted/20" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-3/4 rounded bg-muted/20" />
                    <div className="h-3 w-1/2 rounded bg-muted/20" />
                    <div className="h-6 w-24 rounded bg-muted/20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <ShoppingBag className="h-16 w-16 text-muted/40" aria-hidden="true" />
              <p className="text-base font-medium text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted">
                Add items from the product pages to see them here.
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="
                  mt-2 rounded-lg bg-primary px-5 py-2.5
                  text-sm font-medium text-primary-foreground
                  hover:opacity-90 transition-opacity
                "
              >
                Continue Shopping
              </button>
            </div>
          )}

          {!loading && items.length > 0 && (
            <ul className="space-y-4" role="list">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-border bg-background p-3"
                >
                  {/* Product image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                    {item.product?.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted/40" />
                      </div>
                    )}
                  </div>

                  {/* Info + controls */}
                  <div className="flex flex-1 flex-col justify-between gap-1 min-w-0">
                    <div>
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.product?.name ?? "Unknown product"}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity stepper */}
                      <div className="flex items-center rounded-lg border border-border overflow-hidden">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="
                            flex h-7 w-7 items-center justify-center
                            text-muted hover:text-primary hover:bg-primary/10
                            disabled:opacity-40 disabled:cursor-not-allowed
                            transition-colors
                          "
                        >
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-foreground select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="
                            flex h-7 w-7 items-center justify-center
                            text-muted hover:text-primary hover:bg-primary/10
                            transition-colors
                          "
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        aria-label={`Remove ${item.product?.name ?? "item"} from cart`}
                        onClick={() => removeFromCart(item.id)}
                        className="
                          rounded-lg p-1.5 text-muted
                          hover:text-error hover:bg-error/10
                          transition-colors
                        "
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer: subtotal + checkout ── */}
        {!loading && items.length > 0 && (
          <div className="border-t border-border px-4 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Subtotal</span>
              <span className="text-lg font-bold text-foreground">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted">
              Shipping and taxes calculated at checkout.
            </p>
            <button
              type="button"
              className="
                w-full rounded-xl bg-primary py-3.5
                text-sm font-semibold text-primary-foreground
                hover:opacity-90 transition-opacity
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
              "
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
