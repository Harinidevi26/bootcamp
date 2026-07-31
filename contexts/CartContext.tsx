"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuthState } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  slug: string;
  category: string;
  stock: number;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product: CartProduct | null;
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  itemCount: number;               // total units across all items
  subtotal: number;                // sum of price * quantity
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthState();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Fetch cart whenever the signed-in user changes ──
  const fetchCart = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?user_id=${encodeURIComponent(uid)}`);
      const json = await res.json();
      if (res.ok) setItems(json.data ?? []);
    } catch {
      // network error — keep existing items
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchCart(user.uid);
    } else {
      setItems([]);          // clear cart when signed out
    }
  }, [user?.uid, fetchCart]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal  = items.reduce(
    (sum, i) => sum + (i.product?.price ?? 0) * i.quantity,
    0
  );

  // ── Mutations ───────────────────────────────────────────────────────────────

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      if (!user?.uid) throw new Error("Not signed in");
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uid, product_id: productId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");
      // Re-fetch so product join is included
      await fetchCart(user.uid);
    },
    [user?.uid, fetchCart]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!user?.uid) return;
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      // Optimistic update — replace the item in state
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    },
    [user?.uid]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (!user?.uid) return;
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    },
    [user?.uid]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        itemCount,
        subtotal,
        drawerOpen,
        openDrawer:  () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
