"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  PackageSearch,
  Loader2,
  Save,
  ChevronDown,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  stock: number;
  image_url?: string;
  created_at?: string;
}

type FormState = Omit<Product, "id" | "created_at">;

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: 0,
  category: "",
  stock: 0,
  image_url: "",
};

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

/** Reusable labelled input */
function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition";

/** Product form used in both Add and Edit modal */
function ProductForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  isEdit,
}: {
  form: FormState;
  onChange: (field: keyof FormState, value: string | number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  isEdit: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Row: name + category */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Product Name *" id="pf-name">
          <input
            id="pf-name"
            type="text"
            className={inputCls}
            placeholder="e.g. Wireless Headphones"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
          />
        </Field>
        <Field label="Category" id="pf-category">
          <input
            id="pf-category"
            type="text"
            className={inputCls}
            placeholder="e.g. Electronics"
            value={form.category ?? ""}
            onChange={(e) => onChange("category", e.target.value)}
          />
        </Field>
      </div>

      {/* Row: price + stock */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Price (₹) *" id="pf-price">
          <input
            id="pf-price"
            type="number"
            min={0}
            step="0.01"
            className={inputCls}
            placeholder="0.00"
            value={form.price}
            onChange={(e) => onChange("price", parseFloat(e.target.value) || 0)}
            required
          />
        </Field>
        <Field label="Stock" id="pf-stock">
          <input
            id="pf-stock"
            type="number"
            min={0}
            step="1"
            className={inputCls}
            placeholder="0"
            value={form.stock}
            onChange={(e) =>
              onChange("stock", parseInt(e.target.value, 10) || 0)
            }
          />
        </Field>
      </div>

      {/* Image URL */}
      <Field label="Image URL" id="pf-image_url">
        <input
          id="pf-image_url"
          type="url"
          className={inputCls}
          placeholder="https://example.com/image.png"
          value={form.image_url ?? ""}
          onChange={(e) => onChange("image_url", e.target.value)}
        />
      </Field>

      {/* Description */}
      <Field label="Description" id="pf-description">
        <textarea
          id="pf-description"
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Short description of the product…"
          value={form.description ?? ""}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </Field>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          id="pf-cancel"
          onClick={onCancel}
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-50"
        >
          <X size={15} aria-hidden="true" />
          Cancel
        </button>
        <button
          type="button"
          id="pf-submit"
          onClick={onSubmit}
          disabled={submitting || !form.name.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Save size={15} aria-hidden="true" />
          )}
          {isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Modal shell
───────────────────────────────────────────────────────────── */
function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    /* backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* panel */}
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            id="modal-close"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-background transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {/* body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Delete confirmation modal
───────────────────────────────────────────────────────────── */
function DeleteConfirmModal({
  product,
  onCancel,
  onConfirm,
  deleting,
}: {
  product: Product | null;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <Modal
      open={!!product}
      title="Delete Product"
      onClose={onCancel}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 p-4">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-error"
            aria-hidden="true"
          />
          <p className="text-sm text-foreground">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold">{product?.name}</span>? This action
            cannot be undone.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            id="delete-cancel"
            onClick={onCancel}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-50"
          >
            <X size={15} aria-hidden="true" />
            Cancel
          </button>
          <button
            type="button"
            id="delete-confirm"
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {deleting ? (
              <Loader2
                size={15}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Trash2 size={15} aria-hidden="true" />
            )}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stock badge
───────────────────────────────────────────────────────────── */
function StockBadge({ stock }: { stock: number }) {
  const outOfStock = stock === 0;
  const low = stock > 0 && stock <= 5;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        outOfStock
          ? "bg-error/10 text-error"
          : low
          ? "bg-accent/10 text-accent"
          : "bg-success/10 text-success"
      }`}
    >
      {outOfStock ? "Out of stock" : low ? `Low (${stock})` : stock}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit modal
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Mobile expandable rows
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load products");
      setProducts(json.products ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Add ───────────────────────────────────────────────── */
  function openAdd() {
    setAddForm(EMPTY_FORM);
    setAddError(null);
    setAddOpen(true);
  }

  async function handleAdd() {
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create product");
      setAddOpen(false);
      fetchProducts();
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  /* ── Edit ──────────────────────────────────────────────── */
  function openEdit(p: Product) {
    setEditProduct(p);
    setEditForm({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      category: p.category ?? "",
      stock: p.stock,
      image_url: p.image_url ?? "",
    });
    setEditError(null);
  }

  async function handleEdit() {
    if (!editProduct) return;
    setEditing(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/products/${editProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update product");
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditing(false);
    }
  }

  /* ── Delete ────────────────────────────────────────────── */
  async function handleDelete() {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteProduct.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete product");
      setDeleteProduct(null);
      fetchProducts();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  /* ── Form helpers ──────────────────────────────────────── */
  function patchAdd(field: keyof FormState, value: string | number) {
    setAddForm((f) => ({ ...f, [field]: value }));
  }
  function patchEdit(field: keyof FormState, value: string | number) {
    setEditForm((f) => ({ ...f, [field]: value }));
  }

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* ── Page header ─────────────────────────────────── */}
      <header className="border-b border-border bg-surface px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Products
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            id="open-add-modal"
            onClick={openAdd}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity active:scale-95"
          >
            <Plus size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        {/* Global error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm">Loading products…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-surface py-24 text-center">
            <PackageSearch size={48} className="text-muted" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">No products yet</p>
              <p className="mt-1 text-sm text-muted">
                Click "Add Product" to create your first one.
              </p>
            </div>
            <button
              type="button"
              id="empty-add-btn"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus size={16} aria-hidden="true" />
              Add Product
            </button>
          </div>
        )}

        {/* ── Table (md+) / Card list (mobile) ───────── */}
        {!loading && products.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background text-left">
                    <th className="px-5 py-3.5 font-semibold text-muted">
                      Name
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-muted">
                      Category
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-muted text-right">
                      Price
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-muted">
                      Stock
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-muted text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-background/50 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground line-clamp-1">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="mt-0.5 text-xs text-muted line-clamp-1">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {p.category || (
                          <span className="text-border">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-foreground tabular-nums">
                        {formatPrice(p.price)}
                      </td>
                      <td className="px-5 py-4">
                        <StockBadge stock={p.stock} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            id={`edit-${p.id}`}
                            aria-label={`Edit ${p.name}`}
                            onClick={() => openEdit(p)}
                            className="rounded-lg p-2 text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            id={`delete-${p.id}`}
                            aria-label={`Delete ${p.name}`}
                            onClick={() => setDeleteProduct(p)}
                            className="rounded-lg p-2 text-muted hover:text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <ul className="flex flex-col gap-3 md:hidden">
              {products.map((p) => {
                const expanded = expandedRow === p.id;
                return (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden"
                  >
                    {/* Card header */}
                    <button
                      type="button"
                      id={`row-toggle-${p.id}`}
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedRow(expanded ? null : p.id)
                      }
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-background/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm line-clamp-1">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatPrice(p.price)}
                        </p>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-muted transition-transform duration-200 ${
                          expanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Expanded detail */}
                    {expanded && (
                      <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <dt className="text-xs text-muted">Category</dt>
                            <dd className="text-foreground">
                              {p.category || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted">Stock</dt>
                            <dd>
                              <StockBadge stock={p.stock} />
                            </dd>
                          </div>
                          {p.description && (
                            <div className="col-span-2">
                              <dt className="text-xs text-muted">
                                Description
                              </dt>
                              <dd className="text-foreground line-clamp-2">
                                {p.description}
                              </dd>
                            </div>
                          )}
                        </dl>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            id={`mobile-edit-${p.id}`}
                            onClick={() => openEdit(p)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface py-2 text-sm font-medium text-foreground hover:bg-background transition-colors"
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            id={`mobile-delete-${p.id}`}
                            onClick={() => setDeleteProduct(p)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-error/30 bg-error/5 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>

      {/* ── Add modal ─────────────────────────────────────── */}
      <Modal
        open={addOpen}
        title="Add Product"
        onClose={() => setAddOpen(false)}
      >
        <>
          {addError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              <AlertTriangle size={14} aria-hidden="true" />
              {addError}
            </div>
          )}
          <ProductForm
            form={addForm}
            onChange={patchAdd}
            onSubmit={handleAdd}
            onCancel={() => setAddOpen(false)}
            submitting={adding}
            isEdit={false}
          />
        </>
      </Modal>

      {/* ── Edit modal ─────────────────────────────────────── */}
      <Modal
        open={!!editProduct}
        title={`Edit — ${editProduct?.name ?? ""}`}
        onClose={() => setEditProduct(null)}
      >
        <>
          {editError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              <AlertTriangle size={14} aria-hidden="true" />
              {editError}
            </div>
          )}
          <ProductForm
            form={editForm}
            onChange={patchEdit}
            onSubmit={handleEdit}
            onCancel={() => setEditProduct(null)}
            submitting={editing}
            isEdit={true}
          />
        </>
      </Modal>

      {/* ── Delete confirm modal ───────────────────────────── */}
      <DeleteConfirmModal
        product={deleteProduct}
        onCancel={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
