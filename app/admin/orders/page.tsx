"use client";

/**
 * app/admin/orders/page.tsx
 *
 * Admin orders management screen.
 * – Table (desktop) / card list (mobile) showing all orders
 * – Status filter dropdown
 * – Inline status updater per row (select → save)
 * – Expandable order_items detail
 *
 * Design: design-system tokens only, lucide-react icons, no emoji, no raw hex.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2,
  AlertTriangle,
  PackageSearch,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_phone: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  order_items: OrderItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof ALL_STATUSES)[number];

const STATUS_META: Record<
  OrderStatus,
  { label: string; badgeCls: string }
> = {
  pending:    { label: "Pending",    badgeCls: "bg-accent/15 text-accent" },
  confirmed:  { label: "Confirmed",  badgeCls: "bg-secondary/15 text-secondary" },
  processing: { label: "Processing", badgeCls: "bg-primary/15 text-primary" },
  shipped:    { label: "Shipped",    badgeCls: "bg-success/20 text-success" },
  delivered:  { label: "Delivered",  badgeCls: "bg-success/30 text-success" },
  cancelled:  { label: "Cancelled",  badgeCls: "bg-error/15 text-error" },
};

function statusMeta(status: string) {
  return (
    STATUS_META[status as OrderStatus] ?? {
      label: status,
      badgeCls: "bg-muted/20 text-muted",
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { label, badgeCls } = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}
    >
      {label}
    </span>
  );
}

// ─── Inline status selector ───────────────────────────────────────────────────

function StatusSelector({
  orderId,
  current,
  onSaved,
}: {
  orderId: string;
  current: string;
  onSaved: (newStatus: string) => void;
}) {
  const [selected, setSelected] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = selected !== current;

  // Keep local state in sync when parent refreshes
  const prevCurrent = useRef(current);
  useEffect(() => {
    if (prevCurrent.current !== current) {
      setSelected(current);
      prevCurrent.current = current;
    }
  }, [current]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update status");
      onSaved(selected);
    } catch (e) {
      setError((e as Error).message);
      setSelected(current); // revert
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            id={`status-select-${orderId}`}
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setError(null);
            }}
            disabled={saving}
            className="
              appearance-none rounded-lg border border-border bg-background
              pl-3 pr-8 py-1.5 text-sm text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/50
              transition disabled:opacity-60 cursor-pointer
            "
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusMeta(s).label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>

        {dirty && (
          <button
            type="button"
            id={`status-save-${orderId}`}
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            ) : null}
            Save
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <AlertTriangle size={11} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Order items detail panel ─────────────────────────────────────────────────

function OrderItemsPanel({ items }: { items: OrderItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted py-2">No line items recorded.</p>
    );
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-muted border-b border-border">
          <th className="pb-1 font-medium">Product ID</th>
          <th className="pb-1 font-medium text-right">Qty</th>
          <th className="pb-1 font-medium text-right">Unit price</th>
          <th className="pb-1 font-medium text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="py-1 font-mono text-muted">{shortId(item.product_id)}&hellip;</td>
            <td className="py-1 text-right text-foreground">{item.quantity}</td>
            <td className="py-1 text-right text-foreground tabular-nums">
              {formatPrice(item.price)}
            </td>
            <td className="py-1 text-right font-medium text-foreground tabular-nums">
              {formatPrice(item.price * item.quantity)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  value,
  onChange,
  total,
  filtered,
}: {
  value: string;
  onChange: (v: string) => void;
  total: number;
  filtered: number;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Filter size={15} aria-hidden="true" />
        <span className="font-medium text-foreground">{filtered}</span>
        {filtered !== total && (
          <span className="text-muted">of {total}</span>
        )}{" "}
        order{filtered !== 1 ? "s" : ""}
      </div>

      <div className="relative ml-auto">
        <select
          id="orders-status-filter"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            appearance-none rounded-lg border border-border bg-surface
            pl-3 pr-8 py-2 text-sm text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/50
            transition cursor-pointer shadow-sm
          "
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusMeta(s).label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load orders");
      setOrders(json.orders ?? []);
    } catch (e) {
      setFetchError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── After inline status save: update local state without re-fetch ─────────
  function handleStatusSaved(orderId: string, newStatus: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const displayed = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <header className="border-b border-border bg-surface px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Orders
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {orders.length} order{orders.length !== 1 ? "s" : ""} total
            </p>
          </div>

          <button
            type="button"
            id="orders-refresh"
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        {/* Error */}
        {fetchError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            <AlertTriangle size={16} aria-hidden="true" />
            {fetchError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm">Loading orders…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-surface py-24 text-center">
            <PackageSearch
              size={48}
              className="text-muted"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-foreground">No orders yet</p>
              <p className="mt-1 text-sm text-muted">
                Orders will appear here once customers check out.
              </p>
            </div>
          </div>
        )}

        {/* Populated */}
        {!loading && orders.length > 0 && (
          <>
            {/* Filter bar */}
            <FilterBar
              value={statusFilter}
              onChange={setStatusFilter}
              total={orders.length}
              filtered={displayed.length}
            />

            {/* No results from filter */}
            {displayed.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface py-16 text-center">
                <PackageSearch
                  size={36}
                  className="text-muted"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted">
                  No orders match the selected status.
                </p>
                <button
                  type="button"
                  id="clear-filter"
                  onClick={() => setStatusFilter("")}
                  className="mt-1 text-sm text-primary hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* ── Desktop table ── */}
            {displayed.length > 0 && (
              <>
                <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-background text-left">
                        <th className="px-5 py-3.5 font-semibold text-muted">
                          Order
                        </th>
                        <th className="px-5 py-3.5 font-semibold text-muted">
                          Customer
                        </th>
                        <th className="px-5 py-3.5 font-semibold text-muted text-right">
                          Total
                        </th>
                        <th className="px-5 py-3.5 font-semibold text-muted">
                          Date
                        </th>
                        <th className="px-5 py-3.5 font-semibold text-muted">
                          Status
                        </th>
                        <th className="px-5 py-3.5 font-semibold text-muted">
                          Items
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayed.map((order) => {
                        const expanded = expandedRow === order.id;
                        return [
                          /* Main row */
                          <tr
                            key={order.id}
                            className="hover:bg-background/50 transition-colors"
                          >
                            <td className="px-5 py-4">
                              <span className="font-mono text-xs text-muted">
                                #{shortId(order.id)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-medium text-foreground">
                                {order.shipping_name}
                              </p>
                              <p className="mt-0.5 text-xs text-muted">
                                {order.shipping_city}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-right font-medium text-foreground tabular-nums">
                              {formatPrice(order.total_amount)}
                            </td>
                            <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                              {formatDate(order.created_at)}
                            </td>
                            <td className="px-5 py-4">
                              <StatusSelector
                                orderId={order.id}
                                current={order.status}
                                onSaved={(s) =>
                                  handleStatusSaved(order.id, s)
                                }
                              />
                            </td>
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                id={`toggle-items-${order.id}`}
                                aria-expanded={expanded}
                                onClick={() =>
                                  setExpandedRow(
                                    expanded ? null : order.id
                                  )
                                }
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted border border-border hover:text-foreground hover:bg-background transition-colors"
                              >
                                {order.order_items.length}
                                {expanded ? (
                                  <ChevronUp
                                    size={12}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={12}
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                            </td>
                          </tr>,

                          /* Expanded items row */
                          expanded && (
                            <tr
                              key={`${order.id}-items`}
                              className="bg-background"
                            >
                              <td
                                colSpan={6}
                                className="px-5 py-4 border-t border-border"
                              >
                                <p className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">
                                  Line items
                                </p>
                                <OrderItemsPanel
                                  items={order.order_items}
                                />
                              </td>
                            </tr>
                          ),
                        ];
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile card list ── */}
                <ul className="flex flex-col gap-3 md:hidden">
                  {displayed.map((order) => {
                    const expanded = expandedRow === order.id;
                    return (
                      <li
                        key={order.id}
                        className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden"
                      >
                        {/* Card header */}
                        <div className="px-4 pt-4 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-mono text-muted">
                                #{shortId(order.id)}
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground text-sm">
                                {order.shipping_name}
                              </p>
                              <p className="text-xs text-muted">
                                {order.shipping_city}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-semibold text-foreground tabular-nums">
                                {formatPrice(order.total_amount)}
                              </p>
                              <p className="mt-0.5 text-xs text-muted">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Status selector */}
                          <div className="mt-3">
                            <StatusSelector
                              orderId={order.id}
                              current={order.status}
                              onSaved={(s) =>
                                handleStatusSaved(order.id, s)
                              }
                            />
                          </div>
                        </div>

                        {/* Toggle items */}
                        <button
                          type="button"
                          id={`mobile-toggle-${order.id}`}
                          aria-expanded={expanded}
                          onClick={() =>
                            setExpandedRow(expanded ? null : order.id)
                          }
                          className="w-full flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted hover:bg-background transition-colors"
                        >
                          <span>
                            {order.order_items.length} line item
                            {order.order_items.length !== 1 ? "s" : ""}
                          </span>
                          {expanded ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          )}
                        </button>

                        {/* Expanded items */}
                        {expanded && (
                          <div className="border-t border-border px-4 py-3 bg-background">
                            <OrderItemsPanel items={order.order_items} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
