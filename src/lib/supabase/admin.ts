import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Alias de compatibilidade.
 * Alguns arquivos antigos do sistema chamam createSupabaseAdminClient.
 * Mantemos esse nome para não quebrar dashboard, financeiro e rotas antigas.
 */
export const createSupabaseAdminClient = createAdminSupabaseClient;

export function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "servidor-cejas";
}
