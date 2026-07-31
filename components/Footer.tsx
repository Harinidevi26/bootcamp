import { Store } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        {/* Store name */}
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Store className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-base tracking-tight">
            My<span className="text-primary">Store</span>
          </span>
        </div>

        {/* Copyright */}
        <p className="text-sm text-muted">
          &copy; {CURRENT_YEAR} MyStore. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
