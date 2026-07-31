/**
 * lib/supabase-server.ts
 *
 * Server-only Supabase client that uses the service-role secret key.
 *
 * ── Why a separate file? ──────────────────────────────────────────────────────
 *   lib/supabase.ts uses NEXT_PUBLIC_ anon-key variables and is safe to import
 *   from client components.  The service-role key BYPASSES Row Level Security
 *   and must NEVER be exposed to the browser.  Keeping it in a dedicated module
 *   with no NEXT_PUBLIC_ prefix ensures Next.js never bundles it for the client.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   Import { supabaseServer } in Route Handlers and Server Actions only.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "[supabase-server] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"
  );
}
if (!serviceRoleKey) {
  throw new Error(
    "[supabase-server] Missing environment variable: SUPABASE_SERVICE_ROLE_KEY\n" +
      "Add it to .env.local — NEVER with a NEXT_PUBLIC_ prefix."
  );
}

/**
 * Supabase client initialised with the service-role key.
 * Bypasses Row Level Security — use only in server-side code.
 */
export const supabaseServer = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      // Stateless: no session persistence needed in Route Handlers.
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
