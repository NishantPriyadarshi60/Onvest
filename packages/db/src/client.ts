import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Server/service role client (bypasses RLS). Use only in API routes and webhooks. */
export function createServerClient() {
  if (!url || !key) throw new Error("Supabase URL and service role key required");
  return createClient<Database>(url, key);
}

/** Browser client (anon key; RLS applies). Use for client-side with user session. */
export function createBrowserClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? key;
  if (!url || !anonKey) throw new Error("Supabase URL and anon key required");
  return createClient<Database>(url, anonKey);
}
