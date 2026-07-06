import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let cached: SupabaseClient | null = null;
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return null;
  if (!cached) cached = createClient(url, serviceRole, { auth: { persistSession: false } });
  return cached;
}
export function getStorageBucket() { return process.env.SUPABASE_STORAGE_BUCKET || "servidor-cejas"; }
