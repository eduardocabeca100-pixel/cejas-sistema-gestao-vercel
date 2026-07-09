import type { SupabaseClient } from "@supabase/supabase-js";
import { classificarArquivoServidor } from "@/lib/servidor/classificacao";

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "servidor-cejas";

export type ModoOrganizacao = "inteligente" | "original" | "manual";
export type ModoDuplicado = "replace" | "keep" | "skip";

export type ArquivoRow = {
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

export function limparTexto(valor: string): string {
  return valor
    .replace(/[<>:"|?*\u0000-\u001F]/g, "")
    .replace(/[\\/]/g, "-")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export function limparCaminho(caminho: string): string {
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
    .replace(/\b(boleto|cobran[çc]a|pagamento|vencimento|demonstrativo|relat[óo]rio|financeiro|or[çc]amento|proposta|cota[çc][ãa]o|budget|contrato|termo|acordo|assinado|assinatura|comprovante|pix|transfer[êe]ncia|dep[óo]sito|recibo|nota fiscal|nf|nfs|danfe|fatura|invoice)\b/gi, "")
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

export function montarDestino(params: {
  arquivo: { name: string };
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
  const eventoBase = limparNomeEvento(nomeArquivo);
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

export async function buscarPorCaminho(supabase: SupabaseClient, caminho: string) {
  const { data } = await supabase
    .from("cejas_servidor_arquivos")
    .select("*")
    .eq("bucket", BUCKET)
    .eq("caminho_storage", caminho)
    .maybeSingle();

  return data as ArquivoRow | null;
}

export async function caminhoUnico(supabase: SupabaseClient, caminhoOriginal: string) {
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

export async function removerPorCaminho(supabase: SupabaseClient, caminho: string) {
  await supabase.storage.from(BUCKET).remove([caminho]);

  await supabase
    .from("cejas_servidor_arquivos")
    .delete()
    .eq("bucket", BUCKET)
    .eq("caminho_storage", caminho);
}

export async function adicionarUrls(supabase: SupabaseClient, arquivo: ArquivoRow) {
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
