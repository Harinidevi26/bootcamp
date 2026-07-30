import { Palette, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 md:px-8">
      {/* ── DESIGN SYSTEM DEMO BLOCK ─────────────────────────────
          Temporary — remove once colours & icon are confirmed.
      ─────────────────────────────────────────────────────────── */}
      <section
        id="design-system-demo"
        className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          Design System Preview
        </h1>

        {/* Color swatches */}
        <div className="mb-6 flex flex-wrap gap-3">
          {/* Primary */}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-primary" />
            <span className="text-sm text-muted">primary</span>
          </div>
          {/* Primary foreground */}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="h-4 w-4 rounded-full bg-primary-foreground" />
            </span>
            <span className="text-sm text-muted">primary-fg</span>
          </div>
          {/* Secondary */}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-secondary" />
            <span className="text-sm text-muted">secondary</span>
          </div>
          {/* Accent */}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-accent" />
            <span className="text-sm text-muted">accent</span>
          </div>
          {/* Success */}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-success" />
            <span className="text-sm text-muted">success</span>
          </div>
          {/* Error */}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-error" />
            <span className="text-sm text-muted">error</span>
          </div>
          {/* Muted */}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-muted" />
            <span className="text-sm text-muted">muted</span>
          </div>
          {/* Border */}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full border-2 border-border bg-surface" />
            <span className="text-sm text-muted">border</span>
          </div>
        </div>

        {/* Buttons using theme classes */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Primary Button
          </button>
          <button className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90 transition-opacity">
            Secondary Button
          </button>
          <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors">
            Outline Button
          </button>
        </div>

        {/* Lucide icon confirmation */}
        <div className="flex items-center gap-3 rounded-lg bg-background px-4 py-3">
          <Palette className="text-primary" size={20} />
          <span className="text-sm text-foreground">
            Lucide icons are active —{" "}
          </span>
          <CheckCircle className="text-success" size={20} />
          <span className="text-sm text-success font-medium">ready</span>
        </div>
      </section>
      {/* ── END DEMO BLOCK ──────────────────────────────────────── */}
    </main>
  );
}
