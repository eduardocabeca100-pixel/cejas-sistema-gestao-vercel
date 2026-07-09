import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { BUCKET, adicionarUrls, type ArquivoRow } from "@/lib/servidor/destino";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    if (!supabase) return NextResponse.json({ ok: false, erro: "Supabase não configurado." }, { status: 503 });
    const { searchParams } = new URL(request.url);

    const busca = searchParams.get("busca")?.trim() || "";
    const tipo = searchParams.get("tipo")?.trim() || "";

    let query = supabase
      .from("cejas_servidor_arquivos")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(1000);

    if (tipo && tipo !== "Todos") query = query.eq("tipo_identificado", tipo);

    if (busca) {
      const safe = busca.replaceAll(",", " ");
      query = query.or(`nome.ilike.%${safe}%,evento.ilike.%${safe}%,caminho_storage.ilike.%${safe}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
    }

    const arquivos = await Promise.all(
      ((data || []) as ArquivoRow[]).map((arquivo) => adicionarUrls(supabase, arquivo))
    );

    return NextResponse.json({ ok: true, arquivos });
  } catch (error) {
    return NextResponse.json(
      { ok: false, erro: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    if (!supabase) return NextResponse.json({ ok: false, erro: "Supabase não configurado." }, { status: 503 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const scope = searchParams.get("scope");

    if (scope === "all") {
      const { data: arquivos, error } = await supabase
        .from("cejas_servidor_arquivos")
        .select("id,bucket,caminho_storage");

      if (error) {
        return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
      }

      const paths = (arquivos || []).map((arquivo) => arquivo.caminho_storage).filter(Boolean);

      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths);
      }

      const { error: deleteError } = await supabase
        .from("cejas_servidor_arquivos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) {
        return NextResponse.json({ ok: false, erro: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, removidos: paths.length });
    }

    if (!id) {
      return NextResponse.json({ ok: false, erro: "ID não informado." }, { status: 400 });
    }

    const { data: arquivo, error: selectError } = await supabase
      .from("cejas_servidor_arquivos")
      .select("id,bucket,caminho_storage")
      .eq("id", id)
      .single();

    if (selectError || !arquivo) {
      return NextResponse.json(
        { ok: false, erro: selectError?.message || "Arquivo não encontrado." },
        { status: 404 }
      );
    }

    await supabase.storage.from(arquivo.bucket || BUCKET).remove([arquivo.caminho_storage]);

    const { error: deleteError } = await supabase
      .from("cejas_servidor_arquivos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ ok: false, erro: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, erro: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
