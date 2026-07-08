import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json(key ? null : []);

  if (key) {
    const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
    if (error || !data) return NextResponse.json(null);
    return NextResponse.json(data.value);
  }

  const { data, error } = await supabase.from("settings").select("*");
  if (error || !data) return NextResponse.json([]);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.key) return NextResponse.json({ ok: false, error: "Chave de configuração não informada." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. As configurações não são salvas localmente." }, { status: 503 });

  const { error } = await supabase.from("settings").upsert({ key: body.key, value: body.value ?? {}, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
