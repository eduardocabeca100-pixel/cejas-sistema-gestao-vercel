import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const senha = String(body?.senha || "");
  const lembrar = Boolean(body?.lembrar);

  if (!email || !senha) {
    return NextResponse.json({ ok: false, error: "Informe e-mail e senha." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase não configurado no servidor." }, { status: 503 });
  }

  const { data: user, error } = await supabase.from("app_users").select("*").eq("email", email).maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: "Erro ao consultar usuário." }, { status: 500 });
  }

  if (!user || !user.password_hash) {
    return NextResponse.json({ ok: false, error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  if (user.status !== "ativo") {
    return NextResponse.json({ ok: false, error: "Este usuário está inativo. Fale com o administrador." }, { status: 403 });
  }

  const senhaValida = await bcrypt.compare(senha, user.password_hash);
  if (!senhaValida) {
    return NextResponse.json({ ok: false, error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const permissions: string[] = user.permissions || [];
  const isSuperadmin = user.role === "Superadmin" || permissions.includes("*");

  let token: string, maxAge: number;
  try {
    ({ token, maxAge } = await createSessionToken({
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
      isSuperadmin
    }, lembrar));
  } catch {
    return NextResponse.json({ ok: false, error: "SESSION_SECRET não configurado no servidor. Configure essa variável de ambiente na Vercel." }, { status: 503 });
  }

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions, isSuperadmin }
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge
  });

  return response;
}
