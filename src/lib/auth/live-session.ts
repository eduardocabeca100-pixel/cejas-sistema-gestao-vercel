import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SessionPayload } from "@/lib/auth/session";

export async function hydrateLiveUser(session: SessionPayload): Promise<SessionPayload | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return session;

  const { data, error } = await supabase.from("app_users").select("name,email,role,permissions,status").eq("id", session.uid).maybeSingle();
  if (error || !data) return null;
  if (data.status !== "ativo") return null;

  const permissions: string[] = data.permissions || [];
  const isSuperadmin = data.role === "Superadmin" || permissions.includes("*");

  return { ...session, name: data.name, email: data.email, role: data.role, permissions, isSuperadmin };
}
