"use client";

/**
 * app/admin/layout.tsx
 *
 * Wraps every page under /admin with a sticky top navigation bar
 * linking to Dashboard, Products, and Orders.
 *
 * Design system: bg-surface · border-border · text-foreground · text-muted
 * · text-primary · bg-primary/10 · lucide-react icons — no emoji, no raw hex.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Store, ArrowLeft } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin",          Icon: LayoutDashboard },
  { label: "Products",  href: "/admin/products", Icon: Package },
  { label: "Orders",    href: "/admin/orders",   Icon: ShoppingBag },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Sticky top nav ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md shadow-sm">
        <nav
          className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8"
          aria-label="Admin navigation"
        >
          {/* Brand mark */}
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2 text-primary font-semibold hover:opacity-80 transition-opacity"
            aria-label="Admin dashboard"
          >
            <Store className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm tracking-tight text-foreground">
              My<span className="text-primary">Store</span>{" "}
              <span className="text-muted font-normal">Admin</span>
            </span>
          </Link>

          {/* Divider */}
          <span
            className="hidden sm:block h-5 w-px bg-border"
            aria-hidden="true"
          />

          {/* Nav links */}
          <ul className="flex items-center gap-1" role="list">
            {NAV_ITEMS.map(({ label, href, Icon }) => {
              const active =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);
              return (
                <li key={label}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted hover:text-primary hover:bg-primary/10",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Back to store — trailing edge */}
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to store
          </Link>
        </nav>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
