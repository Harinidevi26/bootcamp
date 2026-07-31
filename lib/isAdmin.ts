/**
 * lib/isAdmin.ts
 *
 * Pure utility — returns true if the given email belongs to an admin.
 *
 * ── How to add an admin ───────────────────────────────────────────────────────
 *   Add the email address (lowercase) to the ADMIN_EMAILS set below.
 *   No server restart needed in development; the build picks it up immediately.
 *
 * ── Security note ────────────────────────────────────────────────────────────
 *   This check is client-side only and should NEVER be used to gate server
 *   resources or API routes.  It is purely a UI convenience that controls
 *   whether the "Admin" navigation link is rendered.  All admin API routes must
 *   perform their own server-side authorization.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ADMIN_EMAILS = new Set([
  // Add admin email addresses here (all lower-case):
  "admin@example.com",
]);

/**
 * Returns true when `email` is a recognised admin address.
 *
 * @param email  The signed-in user's email, or null / undefined when signed out.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}
