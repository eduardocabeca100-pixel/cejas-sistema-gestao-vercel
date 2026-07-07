import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { classificarArquivoServidor } from "@/lib/servidor/classificacao";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "servidor-cejas";

type ModoOrganizacao = "inteligente" | "original" | "manual";
type ModoDuplicado = "replace" | "keep" | "skip";

type ArquivoRow = {
  id: string;
  nome: string;
  nome_original: string;
  tipo_identificado: string;
  bucket: string;
  caminho_storage: string;
  ano: string | null;
  mes: string | null;
  evento: string | null;
  data_evento: string | null;
  extensao: string | null;
  tipo_mime: string | null;
  tamanho: number | null;
  origem: string | null;
  usuario_nome: string | null;
  status_classificacao: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
};

const MESES = [
  "01 JANEIRO",
  "02 FEVEREIRO",
  "03 MARÇO",
  "04 ABRIL",
  "05 MAIO",
  "06 JUNHO",
  "07 JULHO",
  "08 AGOSTO",
  "09 SETEMBRO",
  "10 OUTUBRO",
  "11 NOVEMBRO",
  "12 DEZEMBRO"
];

function limparTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"|?*\u0000-\u001F]/g, "")
    .replace(/\\/g, "/")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function limparCaminho(caminho: string): string {
  return caminho
    .replace(/\\/g, "/")
    .split("/")
    .map(limparTexto)
    .filter(Boolean)
    .filter((parte) => parte !== "." && parte !== "..")
    .join("/");
}

function mesNome(numero: string): string {
  return MESES[Number(numero) - 1] || "";
}

function extrairData(texto: string, anoFallback: string) {
  const normalizado = limparTexto(texto);

  const iso = normalizado.match(/\b(20\d{2})[-_.\/](\d{1,2})[-_.\/](\d{1,2})\b/);
  if (iso) {
    const ano = iso[1];
    const mes = iso[2].padStart(2, "0");
    const dia = iso[3].padStart(2, "0");

    return {
      ano,
      mes,
      dia,
      mesNome: mesNome(mes),
      dataCurta: `${dia}.${mes}`,
      dataSql: `${ano}-${mes}-${dia}`
    };
  }

  const br = normalizado.match(/\b(\d{1,2})[-_.\/](\d{1,2})(?:[-_.\/](20\d{2}|\d{2}))?\b/);
  if (br) {
    const dia = br[1].padStart(2, "0");
    const mes = br[2].padStart(2, "0");
    let ano = br[3] || anoFallback;

    if (ano.length === 2) ano = `20${ano}`;

    return {
      ano,
      mes,
      dia,
      mesNome: mesNome(mes),
      dataCurta: `${dia}.${mes}`,
      dataSql: `${ano}-${mes}-${dia}`
    };
  }

  return null;
}

function limparNomeEvento(nome: string): string {
  const apenasNome = limparTexto(nome).split("/").pop() || nome;
  const semExtensao = apenasNome.replace(/\.[^/.]+$/, "");

  return semExtensao
    .replace(/\b\d{4}[-_.,\/]\d{1,2}[-_.,\/]\d{1,2}\b/g, "")
    .replace(/\b\d{1,2}[-_.,\/]\d{1,2}([-_.,\/]\d{2,4})?\b/g, "")
    .replace(/\b(boleto|cobranca|pagamento|vencimento|demonstrativo|relatorio|financeiro|orcamento|proposta|cotacao|budget|contrato|termo|acordo|assinado|assinatura|comprovante|pix|transferencia|deposito|recibo|nota fiscal|nf|nfs|danfe|fatura|invoice)\b/gi, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function inferirPorPasta(relativePath: string, anoFallback: string) {
  const caminho = limparCaminho(relativePath);
  const partes = caminho.split("/").filter(Boolean);
  const pastas = partes.slice(0, -1);

  const texto = caminho.replace(/\//g, " ");
  const data = extrairData(texto, anoFallback);

  const ano =
    pastas.find((pasta) => /^20\d{2}$/.test(pasta)) ||
    data?.ano ||
    anoFallback;

  const mes =
    pastas.find((pasta) => /^\d{2}\s+/.test(pasta)) ||
    data?.mesNome ||
    "";

  const pastaComData = [...pastas].reverse().find((pasta) =>
    /\b\d{1,2}[-_.,\/]\d{1,2}(?:[-_.,\/](?:20\d{2}|\d{2}))?\b/.test(pasta)
  );

  const ultimaPasta = pastas[pastas.length - 1] || "";

  let evento = pastaComData || ultimaPasta || "";

  evento = limparTexto(evento).replace(/\.[^/.]+$/, "").trim().toUpperCase();

  if (evento && data && !evento.includes(data.dataCurta)) {
    evento = `${evento} - ${data.dataCurta}`;
  }

  return { ano, mes, evento, data };
}

function montarDestino(params: {
  arquivo: File;
  anoSelecionado: string;
  mesManual: string;
  eventoManual: string;
  modo: ModoOrganizacao;
  relativePath: string;
}) {
  const { arquivo, anoSelecionado, mesManual, eventoManual, modo, relativePath } = params;

  const nomeArquivo = limparTexto(arquivo.name);
  const caminhoRelativo = limparCaminho(relativePath || arquivo.name);
  const classificacao = classificarArquivoServidor(nomeArquivo, anoSelecionado);

  if (modo === "manual") {
    const ano = anoSelecionado;
    const mes = mesManual;
    const evento = limparTexto(eventoManual).toUpperCase();

    if (!ano || !mes || !evento) {
      return { erro: "No modo manual, informe ano, mês e evento." };
    }

    const data = extrairData(evento || nomeArquivo, ano);

    return {
      nomeArquivo,
      tipo: classificacao.tipo,
      extensao: classificacao.extensao,
      ano,
      mes,
      evento,
      dataSql: data?.dataSql || null,
      status: "classificado",
      caminhoStorage: `${ano}/${mes}/${evento}/${nomeArquivo}`
    };
  }

  if (modo === "original" && caminhoRelativo.includes("/")) {
    const inferido = inferirPorPasta(caminhoRelativo, anoSelecionado);
    const primeiroSegmento = caminhoRelativo.split("/")[0];

    const caminhoStorage =
      /^20\d{2}$/.test(primeiroSegmento) ||
      primeiroSegmento === "_DOCUMENTOS_FIXOS" ||
      primeiroSegmento === "_VERIFICAR"
        ? caminhoRelativo
        : `${anoSelecionado}/_IMPORTACOES_ORIGINAIS/${caminhoRelativo}`;

    return {
      nomeArquivo,
      tipo: classificacao.tipo,
      extensao: classificacao.extensao,
      ano: inferido.ano,
      mes: inferido.mes,
      evento: inferido.evento,
      dataSql: inferido.data?.dataSql || null,
      status: inferido.evento ? "classificado" : "verificar",
      caminhoStorage
    };
  }

  const inferido = caminhoRelativo.includes("/")
    ? inferirPorPasta(caminhoRelativo, anoSelecionado)
    : null;

  let data = extrairData(nomeArquivo, anoSelecionado);
  let ano = data?.ano || anoSelecionado;
  let mes = data?.mesNome || "";
  let eventoBase = limparNomeEvento(nomeArquivo);
  let evento = data && eventoBase ? `${eventoBase} - ${data.dataCurta}` : "";

  if (inferido?.evento && inferido?.mes) {
    data = inferido.data || data;
    ano = inferido.ano;
    mes = inferido.mes;
    evento = inferido.evento;
  }

  let status = "classificado";
  let caminhoStorage = "";

  if (ano && mes && evento) {
    caminhoStorage = `${ano}/${mes}/${evento}/${nomeArquivo}`;
  } else if (!data) {
    status = "sem_data";
    caminhoStorage = `_VERIFICAR/arquivos sem data/${nomeArquivo}`;
  } else {
    status = "sem_evento";
    caminhoStorage = `_VERIFICAR/arquivos sem evento/${nomeArquivo}`;
  }

  return {
    nomeArquivo,
    tipo: classificacao.tipo,
    extensao: classificacao.extensao,
    ano,
    mes,
    evento,
    dataSql: data?.dataSql || null,
    status,
    caminhoStorage
  };
}

function nomeDuplicado(caminho: string, numero: number): string {
  const partes = caminho.split("/");
  const nome = partes.pop() || caminho;
  const ponto = nome.lastIndexOf(".");

  if (ponto === -1) {
    partes.push(`${nome} (${numero})`);
    return partes.join("/");
  }

  partes.push(`${nome.slice(0, ponto)} (${numero})${nome.slice(ponto)}`);
  return partes.join("/");
}

async function buscarPorCaminho(supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>, caminho: string) {
  const { data } = await supabase
    .from("cejas_servidor_arquivos")
    .select("*")
    .eq("bucket", BUCKET)
    .eq("caminho_storage", caminho)
    .maybeSingle();

  return data as ArquivoRow | null;
}

async function caminhoUnico(supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>, caminhoOriginal: string) {
  let caminho = caminhoOriginal;
  let contador = 2;

  while (contador < 100) {
    const existente = await buscarPorCaminho(supabase, caminho);
    if (!existente) return caminho;

    caminho = nomeDuplicado(caminhoOriginal, contador);
    contador += 1;
  }

  return `${Date.now()}-${caminhoOriginal}`;
}

async function removerPorCaminho(supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>, caminho: string) {
  await supabase.storage.from(BUCKET).remove([caminho]);

  await supabase
    .from("cejas_servidor_arquivos")
    .delete()
    .eq("bucket", BUCKET)
    .eq("caminho_storage", caminho);
}

async function adicionarUrls(supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>, arquivo: ArquivoRow) {
  const view = await supabase.storage
    .from(arquivo.bucket || BUCKET)
    .createSignedUrl(arquivo.caminho_storage, 60 * 60);

  const down = await supabase.storage
    .from(arquivo.bucket || BUCKET)
    .createSignedUrl(arquivo.caminho_storage, 60 * 60, {
      download: arquivo.nome
    });

  return {
    ...arquivo,
    signed_url: view.data?.signedUrl || null,
    signed_download_url: down.data?.signedUrl || view.data?.signedUrl || null
  };
}

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    if (!supabase) return NextResponse.json({ ok: false, erro: "Supabase não configurado." }, { status: 503 });
    const formData = await request.formData();

    const anoSelecionado = formData.get("ano")?.toString() || String(new Date().getFullYear());
    const mesManual = formData.get("mes")?.toString() || "";
    const eventoManual = formData.get("evento")?.toString() || "";
    const usuarioNome = formData.get("usuarioNome")?.toString() || "Eduardo";
    const modo = (formData.get("modoOrganizacao")?.toString() || "inteligente") as ModoOrganizacao;
    const modoDuplicado = (formData.get("duplicateMode")?.toString() || "replace") as ModoDuplicado;
    const relativePath = formData.get("relativePath")?.toString() || "";

    const arquivosForm = [
      ...formData.getAll("files"),
      formData.get("file")
    ].filter((item): item is File => item instanceof File && item.size > 0);

    if (arquivosForm.length === 0) {
      return NextResponse.json({ ok: false, erro: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const registros = [];

    for (const arquivo of arquivosForm) {
      const destino = montarDestino({
        arquivo,
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
        registros.push(await adicionarUrls(supabase, existente));
        continue;
      }

      let caminhoFinal = caminhoBase;

      if (existente && modoDuplicado === "replace") {
        await removerPorCaminho(supabase, caminhoBase);
      }

      if (existente && modoDuplicado === "keep") {
        caminhoFinal = await caminhoUnico(supabase, caminhoBase);
      }

      const bytes = Buffer.from(await arquivo.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(caminhoFinal, bytes, {
          contentType: arquivo.type || "application/octet-stream",
          upsert: false
        });

      if (uploadError) {
        return NextResponse.json(
          { ok: false, erro: `Falha ao enviar ${arquivo.name}: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const nomeFinal = caminhoFinal.split("/").pop() || destino.nomeArquivo;

      const { data: registro, error: dbError } = await supabase
        .from("cejas_servidor_arquivos")
        .insert({
          nome: nomeFinal,
          nome_original: arquivo.name,
          tipo_identificado: destino.tipo,
          bucket: BUCKET,
          caminho_storage: caminhoFinal,
          ano: destino.ano || anoSelecionado,
          mes: destino.mes || null,
          evento: destino.evento || null,
          data_evento: destino.dataSql,
          extensao: destino.extensao || null,
          tipo_mime: arquivo.type || "application/octet-stream",
          tamanho: arquivo.size,
          origem: modo,
          usuario_nome: usuarioNome,
          status_classificacao: destino.status,
          observacoes: relativePath && relativePath !== arquivo.name ? `Caminho original: ${relativePath}` : null
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

      registros.push(await adicionarUrls(supabase, registro as ArquivoRow));
    }

    return NextResponse.json({ ok: true, arquivos: registros });
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
