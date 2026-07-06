export type TipoArquivoServidor =
  | "Boleto"
  | "Demonstrativo"
  | "Orçamento"
  | "Contrato"
  | "Comprovante"
  | "Nota Fiscal"
  | "Imagem"
  | "Planilha"
  | "Documento"
  | "Outros";

export type StatusClassificacaoServidor =
  | "classificado"
  | "verificar"
  | "sem_data"
  | "sem_evento"
  | "duplicado"
  | "invalido";

export type ClassificacaoArquivoServidor = {
  tipo: TipoArquivoServidor;
  ano: string;
  mes: string;
  evento: string;
  dataEvento: string;
  caminhoStorage: string;
  status: StatusClassificacaoServidor;
  extensao: string;
};

export const MESES_CEJAS = [
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

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function limparNomeEvento(nome: string): string {
  const semExtensao = nome.replace(/\.[^/.]+$/, "");
  const semData = semExtensao
    .replace(/\b\d{4}[-_.\/]\d{1,2}[-_.\/]\d{1,2}\b/g, "")
    .replace(/\b\d{1,2}[-_.\/]\d{1,2}([-_.\/]\d{2,4})?\b/g, "");

  const semTipo = semData.replace(
    /\b(boleto|cobranca|cobrança|pagamento|vencimento|demonstrativo|relatorio|relatório|financeiro|orcamento|orçamento|proposta|cotacao|cotação|budget|contrato|termo|acordo|assinado|assinatura|comprovante|pix|transferencia|transferência|deposito|depósito|recibo|nota fiscal|nf|nfs|danfe|fatura|invoice)\b/gi,
    ""
  );

  return semTipo
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function detectarExtensao(nome: string): string {
  const match = nome.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

export function identificarTipoArquivo(nomeArquivo: string): TipoArquivoServidor {
  const nome = normalizarTexto(nomeArquivo);
  const extensao = detectarExtensao(nomeArquivo);

  if (/\b(boleto|cobranca|cobrança|pagamento|vencimento)\b/.test(nome)) return "Boleto";
  if (/\b(demonstrativo|relatorio financeiro|relatório financeiro|resultado financeiro)\b/.test(nome)) return "Demonstrativo";
  if (/\b(orcamento|orçamento|proposta|cotacao|cotação|budget)\b/.test(nome)) return "Orçamento";
  if (/\b(contrato|termo|acordo|assinado|assinatura)\b/.test(nome)) return "Contrato";
  if (/\b(comprovante|pix|transferencia|transferência|deposito|depósito|recibo)\b/.test(nome)) return "Comprovante";
  if (/\b(nota fiscal|nf|nfs|danfe|fatura|invoice)\b/.test(nome)) return "Nota Fiscal";

  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extensao)) return "Imagem";
  if (["xls", "xlsx", "csv"].includes(extensao)) return "Planilha";
  if (["doc", "docx", "pdf", "txt"].includes(extensao)) return "Documento";

  return "Outros";
}

export function identificarDataArquivo(nomeArquivo: string, anoFallback: string) {
  const nome = nomeArquivo.trim();

  const iso = nome.match(/\b(20\d{2})[-_.\/](\d{1,2})[-_.\/](\d{1,2})\b/);
  if (iso) {
    const ano = iso[1];
    const mes = iso[2].padStart(2, "0");
    const dia = iso[3].padStart(2, "0");
    return {
      dia,
      mesNumero: mes,
      ano,
      dataEvento: `${dia}.${mes}.${ano}`
    };
  }

  const br = nome.match(/\b(\d{1,2})[-_.\/](\d{1,2})(?:[-_.\/](20\d{2}|\d{2}))?\b/);
  if (br) {
    const dia = br[1].padStart(2, "0");
    const mes = br[2].padStart(2, "0");
    let ano = br[3] || anoFallback;

    if (ano.length === 2) ano = `20${ano}`;

    return {
      dia,
      mesNumero: mes,
      ano,
      dataEvento: `${dia}.${mes}.${ano}`
    };
  }

  return null;
}

export function montarMesCejas(mesNumero: string): string {
  const index = Number(mesNumero) - 1;
  return MESES_CEJAS[index] || "";
}

export function classificarArquivoServidor(
  nomeArquivo: string,
  anoSelecionado: string,
  pastaAtual?: {
    ano?: string;
    mes?: string;
    evento?: string;
  }
): ClassificacaoArquivoServidor {
  const extensao = detectarExtensao(nomeArquivo);
  const tipo = identificarTipoArquivo(nomeArquivo);
  const data = identificarDataArquivo(nomeArquivo, anoSelecionado || String(new Date().getFullYear()));

  const ano = data?.ano || pastaAtual?.ano || anoSelecionado || String(new Date().getFullYear());
  const mes = data ? montarMesCejas(data.mesNumero) : pastaAtual?.mes || "";
  const eventoBase = limparNomeEvento(nomeArquivo);
  const dataCurta = data ? `${data.dia}.${data.mesNumero}` : "";
  const evento = pastaAtual?.evento || (eventoBase && dataCurta ? `${eventoBase} - ${dataCurta}` : eventoBase);

  let status: StatusClassificacaoServidor = "classificado";
  let caminhoStorage = "";

  const arquivoInvalido =
    nomeArquivo.includes(".DS_Store") ||
    nomeArquivo.includes("Thumbs.db") ||
    nomeArquivo.includes("__MACOSX");

  if (arquivoInvalido) {
    status = "invalido";
    caminhoStorage = `_VERIFICAR/arquivos inválidos/${nomeArquivo}`;
  } else if (!data && !pastaAtual?.evento) {
    status = "sem_data";
    caminhoStorage = `_VERIFICAR/arquivos sem data/${nomeArquivo}`;
  } else if (!evento) {
    status = "sem_evento";
    caminhoStorage = `_VERIFICAR/arquivos sem evento/${nomeArquivo}`;
  } else if (!mes) {
    status = "verificar";
    caminhoStorage = `_VERIFICAR/arquivos não identificados/${nomeArquivo}`;
  } else {
    caminhoStorage = `${ano}/${mes}/${evento}/${nomeArquivo}`;
  }

  return {
    tipo,
    ano,
    mes,
    evento,
    dataEvento: data?.dataEvento || "",
    caminhoStorage,
    status,
    extensao
  };
}
