/**
 * app/admin/page.tsx  —  Admin dashboard home
 *
 * Async Server Component: queries Supabase via the service-role client
 * (lib/supabase-server.ts) for aggregate counts. No client bundle weight,
 * no API round-trip, no "use client".
 *
 * Design system tokens used (from globals.css / @theme inline):
 *   bg-background · bg-surface · text-foreground · text-muted · border-border
 *   text-primary · bg-primary/10 · text-success · bg-success/10
 *   text-accent · bg-accent/10 · text-error · bg-error/10
 *   lucide-react icons — no emoji, no raw hex.
 */

import type { Metadata } from "next";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { supabaseServer } from "@/lib/supabase-server";

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard — store metrics at a glance.",
};

// ── Data fetching ─────────────────────────────────────────────────────────────

interface Stats {
  totalOrders:   number;
  pendingOrders: number;
  paidOrders:    number;
  totalProducts: number;
  hasError:      boolean;
}

async function fetchStats(): Promise<Stats> {
  // Fire all four count queries in parallel to minimise latency.
  const [totalOrders, pendingOrders, paidOrders, totalProducts] =
    await Promise.all([
      supabaseServer
        .from("orders")
        .select("id", { count: "exact", head: true }),
      supabaseServer
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseServer
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid"),
      supabaseServer
        .from("products")
        .select("id", { count: "exact", head: true }),
    ]);

  const hasError =
    !!totalOrders.error   ||
    !!pendingOrders.error ||
    !!paidOrders.error    ||
    !!totalProducts.error;

  if (hasError) {
    console.error("[admin/page] Supabase error(s):", {
      totalOrders:   totalOrders.error,
      pendingOrders: pendingOrders.error,
      paidOrders:    paidOrders.error,
      totalProducts: totalProducts.error,
    });
  }

  return {
    totalOrders:   totalOrders.count   ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    paidOrders:    paidOrders.count    ?? 0,
    totalProducts: totalProducts.count ?? 0,
    hasError,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const stats = await fetchStats();

  // Each card drives its own color via Tailwind token classes —
  // no raw hex, no arbitrary values.
  const cards = [
    {
      id:          "stat-total-orders",
      label:       "Total Orders",
      value:       stats.totalOrders,
      Icon:        ShoppingBag,
      description: "All orders ever placed",
      iconBg:      "bg-primary/10",
      iconColor:   "text-primary",
    },
    {
      id:          "stat-pending-orders",
      label:       "Pending Orders",
      value:       stats.pendingOrders,
      Icon:        Clock,
      description: "Awaiting payment",
      iconBg:      "bg-accent/10",
      iconColor:   "text-accent",
    },
    {
      id:          "stat-paid-orders",
      label:       "Paid Orders",
      value:       stats.paidOrders,
      Icon:        CheckCircle2,
      description: "Successfully paid",
      iconBg:      "bg-success/10",
      iconColor:   "text-success",
    },
    {
      id:          "stat-total-products",
      label:       "Total Products",
      value:       stats.totalProducts,
      Icon:        Package,
      description: "Listed in the catalogue",
      iconBg:      "bg-secondary/10",
      iconColor:   "text-secondary",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted text-sm font-medium">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Overview
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted">
          A live snapshot of your store&apos;s activity.
        </p>
      </div>

      {/* ── Error banner ── */}
      {stats.hasError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Some metrics could not be loaded. Check your Supabase connection and
            environment variables.
          </span>
        </div>
      )}

      {/* ── Summary cards ── */}
      <section aria-label="Summary metrics">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ id, label, value, Icon, description, iconBg, iconColor }) => (
            <div
              key={id}
              id={id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm
                         transition-shadow duration-200 hover:shadow-md"
            >
              {/* Icon badge */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
                aria-hidden="true"
              >
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>

              {/* Metric value + label */}
              <div className="flex flex-col gap-0.5">
                <dd className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {value.toLocaleString("en-IN")}
                </dd>
                <dt className="text-sm font-medium text-muted">{label}</dt>
              </div>

              {/* Hint text */}
              <p className="text-xs text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Quick actions ── */}
      <section aria-label="Quick actions" className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/products"
            id="quick-action-products"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface
                       px-4 py-2.5 text-sm font-medium text-muted
                       hover:text-primary hover:border-primary/40 hover:bg-primary/5
                       transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Package className="h-4 w-4" aria-hidden="true" />
            Manage Products
          </a>
          <a
            href="/admin/orders"
            id="quick-action-orders"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface
                       px-4 py-2.5 text-sm font-medium text-muted
                       hover:text-primary hover:border-primary/40 hover:bg-primary/5
                       transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            View Orders
          </a>
        </div>
      </section>

    </div>
  );
}
