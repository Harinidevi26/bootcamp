import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { createSupabaseClient, type Order } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string;
    slug: string;
  } | null;
}

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Order Confirmed",
};

// ─── Data layer ───────────────────────────────────────────────────────────────

async function fetchOrder(id: string): Promise<OrderWithItems | null> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id,
        order_id,
        product_id,
        quantity,
        price,
        product:products ( name, image_url, slug )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[order-confirmation] fetchOrder:", error);
    return null;
  }

  return data as OrderWithItems | null;
}

// ─── Detail row helper ────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-accent/10 text-accent",
  paid:      "bg-success/10 text-success",
  shipped:   "bg-secondary/10 text-secondary",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-error/10 text-error",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-muted/10 text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await fetchOrder(id);

  if (!order) notFound();

  const tax = order.total_amount * (0.1 / 1.1); // reverse the 10% tax from total
  const subtotal = order.total_amount - tax;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        {/* ── Success header ── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2
              className="h-9 w-9 text-success"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Order confirmed!
          </h1>
          <p className="mt-2 text-base text-muted">
            Thank you for your purchase. Your order is being processed.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs text-muted">Order ID:</span>
            <code className="rounded bg-surface border border-border px-2 py-0.5 font-mono text-xs text-foreground">
              {order.id}
            </code>
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_280px]">

          {/* ── Items ── */}
          <section
            className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            aria-label="Order items"
          >
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <Package className="h-5 w-5 text-primary" aria-hidden="true" />
              Items ordered
            </h2>

            <ul className="divide-y divide-border">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  {item.product?.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="h-14 w-14 rounded-lg border border-border object-cover object-center shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.product?.name ?? "Product"}
                    </p>
                    <p className="text-xs text-muted">
                      Qty {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-3 mt-3">
                <span>Total paid</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {/* ── Shipping details ── */}
          <section
            className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            aria-label="Shipping details"
          >
            <h2 className="mb-5 text-base font-semibold text-foreground">
              Shipping to
            </h2>
            <div className="space-y-4">
              <DetailRow
                icon={User}
                label="Recipient"
                value={order.shipping_name}
              />
              <DetailRow
                icon={MapPin}
                label="Address"
                value={`${order.shipping_address}, ${order.shipping_city} ${order.shipping_postal_code}`}
              />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={order.shipping_phone}
              />
            </div>
          </section>
        </div>

        {/* ── CTA ── */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/products"
            className="
              inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5
              text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90
              focus:outline-none focus:ring-2 focus:ring-primary/40
            "
          >
            Continue shopping
          </Link>
          <Link
            href="/"
            className="
              inline-flex items-center justify-center rounded-xl border border-border
              bg-surface px-6 py-2.5 text-sm font-medium text-foreground transition-colors
              hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/40
            "
          >
            Go to home
          </Link>
        </div>
      </div>
    </div>
  );
}
