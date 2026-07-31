"use client";

import { useState } from "react";
import { ShoppingCart, LogIn } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuthState } from "@/lib/firebase";
import { signInWithGoogle } from "@/lib/firebase";

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const { addToCart, openDrawer } = useCart();
  const { user, loading: authLoading } = useAuthState();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAdd() {
    setError(null);

    // Prompt sign-in if not authenticated
    if (!user) {
      try {
        await signInWithGoogle();
      } catch {
        setError("Sign-in cancelled. Please sign in to add items to your cart.");
        return;
      }
    }

    setAdding(true);
    try {
      await addToCart(productId, 1);
      setSuccess(true);
      openDrawer();
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to add to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  if (authLoading) {
    return (
      <button
        disabled
        className="
          flex w-full items-center justify-center gap-2 rounded-xl
          bg-primary/50 px-8 py-4
          text-base font-medium text-primary-foreground
          sm:w-auto cursor-not-allowed
        "
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        Loading…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={adding}
        onClick={handleAdd}
        className="
          flex w-full items-center justify-center gap-2 rounded-xl
          bg-primary px-8 py-4
          text-base font-medium text-primary-foreground
          hover:opacity-90 transition-opacity
          focus:outline-none focus:ring-2 focus:ring-primary/40
          disabled:opacity-60 disabled:cursor-not-allowed
          sm:w-auto
        "
      >
        {!user ? (
          <>
            <LogIn className="h-5 w-5" aria-hidden="true" />
            Sign in to Add to Cart
          </>
        ) : adding ? (
          <>
            <ShoppingCart className="h-5 w-5 animate-bounce" aria-hidden="true" />
            Adding…
          </>
        ) : success ? (
          <>
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            Add to Cart
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
