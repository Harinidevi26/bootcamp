<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-system-rules -->
# Project-Wide Design System Rules

These rules apply to **every component, page, and file** built in this project without exception.

## 1 — Colors

- All color hex values are defined **once** in `app/globals.css` under `:root`.
- Use only these CSS custom properties (never raw hex or arbitrary values):
  - `--color-primary` / `--color-primary-foreground`
  - `--color-secondary` / `--color-secondary-foreground`
  - `--color-accent`
  - `--color-background` / `--color-foreground`
  - `--color-surface`
  - `--color-muted`
  - `--color-border`
  - `--color-success`
  - `--color-error`
- In Tailwind classes, use the mapped theme tokens: `bg-primary`, `text-foreground`, `border-border`, `bg-surface`, `text-error`, etc.
- **Never** write a raw hex code, `bg-blue-500`, or any arbitrary color like `bg-[#fff]` inside a component.

## 2 — Tailwind Configuration

This project uses **Tailwind CSS v4**. There is no `tailwind.config.ts`.
All theme extensions live in the `@theme inline` block inside `app/globals.css`.

## 3 — Icons

- **Every icon must be a `lucide-react` component** (e.g. `import { ShoppingCart } from "lucide-react"`).
- **Never** use emoji anywhere — not in UI text, placeholder content, or code comments.

## 4 — Responsive / Mobile-First

- Design for small screens first.
- Scale up with Tailwind's `sm:` / `md:` / `lg:` breakpoint prefixes.
- Every layout must be fully usable on a 375 px-wide screen.
<!-- END:design-system-rules -->
