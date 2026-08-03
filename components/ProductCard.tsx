"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface ProductCardProps {
  id?: string;
  name: string;
  price: number;
  image?: string;
  image_url?: string;
  category?: string;
  slug: string;
}

export default function ProductCard({
  name,
  price,
  image,
  image_url,
  category,
  slug,
}: ProductCardProps) {
  const imageUrl = image_url || image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      {/* ── Image & Badge ── */}
      <div className="relative aspect-square w-full overflow-hidden bg-background">
        {category && (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-border/50 bg-surface/90 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-foreground shadow-xs">
            {category}
          </span>
        )}
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
          <p className="mt-1.5 text-lg font-bold text-foreground">
            ${price.toFixed(2)}
          </p>
        </div>

        {/* ── CTA ── */}
        <div className="mt-4 pt-2">
          <Link
            href={`/products/${slug}`}
            className="
              inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl
              bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary
              transition-all hover:bg-primary hover:text-primary-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/40
            "
          >
            <span>View Details</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
