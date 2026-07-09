import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  BUCKET,
  buscarPorCaminho,
  caminhoUnico,
  limparCaminho,
  montarDestino,
  removerPorCaminho,
  adicionarUrls,
  type ModoDuplicado,
  type ModoOrganizacao
} from "@/lib/servidor/destino";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    if (!supabase) return NextResponse.json({ ok: false, erro: "Supabase não configurado." }, { status: 503 });

    const body = await request.json().catch(() => null);
    const fileName = String(body?.fileName || "");
    const relativePath = String(body?.relativePath || fileName);
    const anoSelecionado = String(body?.ano || new Date().getFullYear());
    const mesManual = String(body?.mes || "");
    const eventoManual = String(body?.evento || "");
    const modo = (String(body?.modoOrganizacao || "inteligente")) as ModoOrganizacao;
    const modoDuplicado = (String(body?.duplicateMode || "replace")) as ModoDuplicado;

    if (!fileName) return NextResponse.json({ ok: false, erro: "Nome do arquivo não informado." }, { status: 400 });

    const destino = montarDestino({
      arquivo: { name: fileName },
      anoSelecionado,
      mesManual,
      eventoManual,
      modo,
      relativePath
    });

    if ("erro" in destino) {
      return NextResponse.json({ ok: false, erro: destino.erro }, { status: 400 });
    }

    const caminhoBase = limparCaminho(destino.caminhoStorage);
    const existente = await buscarPorCaminho(supabase, caminhoBase);

    if (existente && modoDuplicado === "skip") {
      const arquivoComUrls = await adicionarUrls(supabase, existente);
      return NextResponse.json({ ok: true, skip: true, arquivo: arquivoComUrls });
    }

    let caminhoFinal = caminhoBase;

    if (existente && modoDuplicado === "replace") {
      await removerPorCaminho(supabase, caminhoBase);
    }

    if (existente && modoDuplicado === "keep") {
      caminhoFinal = await caminhoUnico(supabase, caminhoBase);
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(caminhoFinal);
    if (error || !data) {
      return NextResponse.json({ ok: false, erro: error?.message || "Não foi possível gerar o link de upload." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      skip: false,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      destino: { ...destino, caminhoStorage: caminhoFinal }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, erro: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
