import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, conectado: false, erro: "Supabase não configurado." },
        { status: 503 }
      );
    }

    const { error } = await supabase
      .from("cejas_servidor_arquivos")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          conectado: true,
          tabela: false,
          erro: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      conectado: true,
      tabela: true,
      bucket: process.env.SUPABASE_STORAGE_BUCKET || "servidor-cejas"
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        conectado: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
