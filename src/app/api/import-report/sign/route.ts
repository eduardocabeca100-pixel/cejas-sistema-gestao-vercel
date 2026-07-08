import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, getStorageBucket } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const fileName = String(body?.fileName || "relatorio.pdf");

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado no servidor." }, { status: 503 });

  const storagePath = `relatorios/${new Date().getFullYear()}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { data, error } = await supabase.storage.from(getStorageBucket()).createSignedUploadUrl(storagePath);
  if (error || !data) return NextResponse.json({ ok: false, error: error?.message || "Não foi possível gerar o link de upload." }, { status: 500 });

  return NextResponse.json({ ok: true, path: data.path, token: data.token });
}
