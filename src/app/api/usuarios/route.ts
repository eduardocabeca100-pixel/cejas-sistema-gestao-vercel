import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() { return NextResponse.json(await getUsers()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.email?.endsWith("@cejas.com.br")) return NextResponse.json({ ok: false, error: "Use e-mail institucional @cejas.com.br" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva usuários localmente." }, { status: 503 });

  const { data, error } = await supabase.from("app_users").insert({ name: body.name, email: body.email, role: body.role, permissions: body.permissions || [], status: body.status || "ativo" }).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, user: data });
}
