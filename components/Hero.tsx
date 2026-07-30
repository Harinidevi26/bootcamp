import { ArrowRight, ShoppingBag } from "lucide-react";

export default function Hero() {
  return (
    <section
      aria-label="Hero"
      /* Gradient built entirely from design-system tokens */
      className="
        relative overflow-hidden
        bg-gradient-to-br from-primary via-secondary to-accent
        px-4 py-24 sm:py-32
        text-primary-foreground
      "
    >
      {/* ── Decorative blurred blobs (theme colors, fully opaque-safe) ── */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute -top-24 -left-24
          h-[480px] w-[480px] rounded-full
          bg-primary/40 blur-3xl
        "
      />
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute -bottom-32 -right-16
          h-[400px] w-[400px] rounded-full
          bg-secondary/40 blur-3xl
        "
      />

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-4xl text-center">
        {/* Eyebrow badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          New arrivals are here
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Discover Products{" "}
          <span className="block text-accent drop-shadow-sm">
            You&apos;ll Actually Love
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
          Hand-picked collections, unbeatable prices, and a shopping experience
          built around you. From everyday essentials to standout finds — it all
          starts here.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#"
            className="
              inline-flex items-center gap-2
              rounded-full bg-primary-foreground px-8 py-3.5
              text-sm font-semibold text-primary shadow-lg
              transition-all duration-200
              hover:bg-primary-foreground/90 hover:shadow-xl hover:-translate-y-0.5
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground
            "
          >
            Shop Now
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>

          <a
            href="#"
            className="
              inline-flex items-center gap-2
              rounded-full border border-primary-foreground/40 px-8 py-3.5
              text-sm font-semibold text-primary-foreground
              transition-all duration-200
              hover:bg-primary-foreground/10 hover:-translate-y-0.5
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground
            "
          >
            Browse Products
          </a>
        </div>
      </div>
    </section>
  );
}
