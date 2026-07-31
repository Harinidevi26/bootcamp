"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Menu,
  X,
  Store,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { useAuthState, signInWithGoogle, signOutUser } from "@/lib/firebase";
import { useCart } from "@/contexts/CartContext";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Persists login across page refreshes via Firebase's onAuthStateChanged
  const { user, loading } = useAuthState();

  // Live cart count + drawer trigger from CartContext
  const { itemCount, openDrawer } = useCart();

  // Close the profile dropdown when the user clicks outside it
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignIn() {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // Popup closed or blocked — fail silently
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOutUser();
  }

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
        <ul className="hidden md:flex items-center gap-8" role="list">
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

        {/* ── Right: Cart + Auth + Hamburger ── */}
        <div className="flex items-center gap-1">
          {/* Cart button — opens CartDrawer, badge shows live itemCount */}
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            className="
              relative flex items-center justify-center
              rounded-full p-2 text-muted
              hover:text-primary hover:bg-primary/10
              transition-colors
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
            "
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span
                aria-hidden="true"
                className="
                  absolute -top-0.5 -right-0.5
                  flex h-4 min-w-4 items-center justify-center
                  rounded-full bg-primary px-1
                  text-primary-foreground text-[10px] font-bold leading-none
                "
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          {/* ── Auth area ── */}
          {/* While Firebase is resolving the persisted session, show nothing */}
          {!loading && (
            <>
              {user ? (
                /* ── Signed-in: profile photo + dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    id="user-menu-button"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                    aria-label="Open account menu"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="
                      flex items-center justify-center
                      rounded-full ring-2 ring-transparent
                      hover:ring-primary/40 transition-all
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                    "
                  >
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName ?? "Profile photo"}
                        width={34}
                        height={34}
                        className="rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      /* Fallback avatar when no photo URL is present */
                      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" aria-hidden="true" />
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div
                      role="menu"
                      aria-labelledby="user-menu-button"
                      className="
                        absolute right-0 top-full mt-2 w-56
                        rounded-xl border border-border bg-surface shadow-lg
                        py-1 z-50
                        animate-in fade-in slide-in-from-top-1 duration-150
                      "
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.displayName ?? "Anonymous"}
                        </p>
                        <p className="text-xs text-muted truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>

                      {/* Sign out */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="
                          flex w-full items-center gap-2.5
                          px-4 py-2.5 text-sm font-medium text-muted
                          hover:text-error hover:bg-error/5
                          transition-colors
                        "
                      >
                        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Signed-out: Sign in button ── */
                <button
                  type="button"
                  id="sign-in-button"
                  disabled={authLoading}
                  onClick={handleSignIn}
                  aria-label="Sign in with Google"
                  className="
                    hidden sm:flex items-center gap-2
                    rounded-lg border border-border
                    px-3 py-1.5 text-sm font-medium text-foreground
                    bg-surface hover:bg-primary/5 hover:border-primary/40
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                  "
                >
                  <LogIn className="h-4 w-4 text-primary" aria-hidden="true" />
                  {authLoading ? "Signing in…" : "Sign in"}
                </button>
              )}
            </>
          )}

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
        <div id="mobile-menu" className="md:hidden border-t border-border bg-surface">
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

            {/* Mobile sign-in row */}
            {!loading && (
              <li>
                {user ? (
                  <button
                    type="button"
                    onClick={() => { handleSignOut(); setMenuOpen(false); }}
                    className="
                      flex w-full items-center gap-2.5 rounded-lg
                      px-3 py-2.5 text-sm font-medium text-muted
                      hover:text-error hover:bg-error/5
                      transition-colors
                    "
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Sign out ({user.displayName?.split(" ")[0] ?? "You"})
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => { handleSignIn(); setMenuOpen(false); }}
                    className="
                      flex w-full items-center gap-2.5 rounded-lg
                      px-3 py-2.5 text-sm font-medium text-muted
                      hover:text-primary hover:bg-primary/10
                      transition-colors
                      disabled:opacity-50
                    "
                  >
                    <LogIn className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {authLoading ? "Signing in…" : "Sign in with Google"}
                  </button>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
