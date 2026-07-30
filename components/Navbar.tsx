"use client";

import { useState } from "react";
import { ShoppingCart, Menu, X, Store } from "lucide-react";

interface NavbarProps {
  /** Number of items currently in the cart. */
  cartItemCount?: number;
}

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Products", href: "#" },
] as const;

export default function Navbar({ cartItemCount = 0 }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md shadow-sm">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* ── Left: Store logo + name ── */}
        <a
          href="#"
          className="flex shrink-0 items-center gap-2 text-primary font-semibold hover:opacity-80 transition-opacity"
          aria-label="MyStore — go to home"
        >
          <Store className="h-6 w-6" aria-hidden="true" />
          <span className="text-lg tracking-tight text-foreground">
            My<span className="text-primary">Store</span>
          </span>
        </a>

        {/* ── Center: Desktop nav links ── */}
        <ul
          className="hidden md:flex items-center gap-8"
          role="list"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="
                  relative text-sm font-medium text-muted
                  hover:text-foreground transition-colors
                  after:absolute after:left-0 after:-bottom-0.5
                  after:h-[2px] after:w-0 after:rounded-full after:bg-primary
                  after:transition-[width] after:duration-200
                  hover:after:w-full
                "
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Right: Cart icon + hamburger ── */}
        <div className="flex items-center gap-1">
          {/* Cart button — always visible */}
          <button
            type="button"
            aria-label={`Cart — ${cartItemCount} item${cartItemCount !== 1 ? "s" : ""}`}
            className="
              relative flex items-center justify-center
              rounded-full p-2 text-muted
              hover:text-primary hover:bg-primary/10
              transition-colors
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
            "
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />

            {/* Badge — only render when there are items */}
            {cartItemCount > 0 && (
              <span
                aria-hidden="true"
                className="
                  absolute -top-0.5 -right-0.5
                  flex h-4 min-w-4 items-center justify-center
                  rounded-full bg-primary px-1
                  text-primary-foreground text-[10px] font-bold leading-none
                "
              >
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </button>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="
              flex md:hidden items-center justify-center
              rounded-full p-2 text-muted
              hover:text-primary hover:bg-primary/10
              transition-colors
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
            "
          >
            {menuOpen
              ? <X className="h-5 w-5" aria-hidden="true" />
              : <Menu className="h-5 w-5" aria-hidden="true" />
            }
          </button>
        </div>
      </nav>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-border bg-surface"
        >
          <ul className="flex flex-col px-4 py-2 gap-0.5" role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="
                    block rounded-lg px-3 py-2.5
                    text-sm font-medium text-muted
                    hover:text-primary hover:bg-primary/10
                    transition-colors
                  "
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
