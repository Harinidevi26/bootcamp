"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/app/api/products/route";

// ─── Categories derived from seed data ───────────────────────────────────────
const CATEGORIES = [
  "All",
  "Electronics",
  "Accessories",
  "Footwear",
  "Bags",
  "Home & Kitchen",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildApiUrl(search: string, category: string): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (category && category !== "All") params.set("category", category);
  const qs = params.toString();
  return `/api/products${qs ? `?${qs}` : ""}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Debounce: only fire fetch 350 ms after the user stops typing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(
    async (searchVal: string, categoryVal: string) => {
      setLoading(true);
      try {
        const res = await fetch(buildApiUrl(searchVal, categoryVal));
        if (!res.ok) throw new Error("Network response was not ok");
        const data: { products: Product[] } = await res.json();
        setProducts(data.products);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-fetch whenever search or category changes (with debounce on search)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(search, category);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, category, fetchProducts]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page header ── */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            All Products
          </h1>
          <p className="mt-2 text-base text-muted">
            Browse our full catalogue — use search or a category filter to find
            exactly what you need.
          </p>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:px-8">
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="product-search"
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full rounded-lg border border-border bg-background
                py-2.5 pl-9 pr-4 text-sm text-foreground
                placeholder:text-muted
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                transition-colors
              "
            />
          </div>

          {/* Category dropdown */}
          <div className="relative flex items-center gap-2">
            <SlidersHorizontal
              className="h-4 w-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <select
              id="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="
                rounded-lg border border-border bg-background
                py-2.5 pl-3 pr-8 text-sm text-foreground
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                transition-colors cursor-pointer
              "
              aria-label="Filter by category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-border bg-surface overflow-hidden"
              >
                <div className="h-52 bg-muted/20" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-muted/20" />
                  <div className="h-3 w-1/2 rounded bg-muted/20" />
                  <div className="h-8 w-full rounded-lg bg-muted/20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <PackageSearch className="h-16 w-16 text-muted/50" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-foreground">
              No products found
            </h2>
            <p className="text-sm text-muted">
              Try adjusting your search or clearing the category filter.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="
                mt-2 rounded-lg bg-primary px-5 py-2.5
                text-sm font-medium text-primary-foreground
                hover:opacity-90 transition-opacity
              "
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Results + count */}
        {!loading && products.length > 0 && (
          <>
            <p className="mb-6 text-sm text-muted">
              Showing{" "}
              <span className="font-medium text-foreground">
                {products.length}
              </span>{" "}
              {products.length === 1 ? "product" : "products"}
              {category !== "All" && (
                <>
                  {" "}in{" "}
                  <span className="font-medium text-foreground">{category}</span>
                </>
              )}
              {search.trim() && (
                <>
                  {" "}for{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{search.trim()}&rdquo;
                  </span>
                </>
              )}
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
