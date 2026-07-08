import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUsers } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() { return NextResponse.json(await getUsers()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.email?.endsWith("@cejas.com.br")) return NextResponse.json({ ok: false, error: "Use e-mail institucional @cejas.com.br" }, { status: 400 });
  if (!body.password || String(body.password).length < 6) return NextResponse.json({ ok: false, error: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva usuários localmente." }, { status: 503 });

  const passwordHash = await bcrypt.hash(String(body.password), 12);
  const { data, error } = await supabase.from("app_users").insert({
    name: body.name,
    email: String(body.email).trim().toLowerCase(),
    password_hash: passwordHash,
    role: body.role,
    permissions: body.permissions || [],
    status: body.status || "ativo"
  }).select("id,name,email,role,permissions,status,created_at").single();

  if (error) {
    const message = error.code === "23505" ? "Já existe um usuário com esse e-mail." : error.message;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, user: data });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  if (!body.id) return NextResponse.json({ ok: false, error: "Usuário não informado." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado." }, { status: 503 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.role !== undefined) updates.role = body.role;
  if (body.status !== undefined) updates.status = body.status;
  if (body.permissions !== undefined) updates.permissions = body.permissions;
  if (body.password) {
    if (String(body.password).length < 6) return NextResponse.json({ ok: false, error: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    updates.password_hash = await bcrypt.hash(String(body.password), 12);
  }

  const { data, error } = await supabase.from("app_users").update(updates).eq("id", body.id).select("id,name,email,role,permissions,status").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, user: data });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Usuário não informado." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado." }, { status: 503 });

  const { error } = await supabase.from("app_users").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
