import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { BUCKET, adicionarUrls } from "@/lib/servidor/destino";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    if (!supabase) return NextResponse.json({ ok: false, erro: "Supabase não configurado." }, { status: 503 });

    const body = await request.json().catch(() => null);
    const caminhoFinal = String(body?.path || "");
    const destino = body?.destino || {};
    const usuarioNome = String(body?.usuarioNome || "Eduardo");
    const modo = String(body?.modoOrganizacao || "inteligente");
    const relativePath = String(body?.relativePath || "");
    const fileSize = Number(body?.fileSize || 0);
    const fileType = String(body?.fileType || "application/octet-stream");
    const nomeOriginal = String(body?.fileName || destino.nomeArquivo || caminhoFinal.split("/").pop() || "");

    if (!caminhoFinal) return NextResponse.json({ ok: false, erro: "Caminho do arquivo não informado." }, { status: 400 });

    const nomeFinal = caminhoFinal.split("/").pop() || destino.nomeArquivo || nomeOriginal;

    const { data: registro, error: dbError } = await supabase
      .from("cejas_servidor_arquivos")
      .insert({
        nome: nomeFinal,
        nome_original: nomeOriginal,
        tipo_identificado: destino.tipo || "Outros",
        bucket: BUCKET,
        caminho_storage: caminhoFinal,
        ano: destino.ano || null,
        mes: destino.mes || null,
        evento: destino.evento || null,
        data_evento: destino.dataSql || null,
        extensao: destino.extensao || null,
        tipo_mime: fileType,
        tamanho: fileSize,
        origem: modo,
        usuario_nome: usuarioNome,
        status_classificacao: destino.status || "verificar",
        observacoes: relativePath && relativePath !== nomeOriginal ? `Caminho original: ${relativePath}` : null
      })
      .select("*")
      .single();

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([caminhoFinal]);
      return NextResponse.json(
        { ok: false, erro: `Arquivo enviado, mas falhou ao gravar metadados: ${dbError.message}` },
        { status: 500 }
      );
    }

    const arquivoComUrls = await adicionarUrls(supabase, registro);
    return NextResponse.json({ ok: true, arquivo: arquivoComUrls });
  } catch (error) {
    return NextResponse.json(
      { ok: false, erro: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
