"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ArquivoServidor = {
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
  criado_em: string;
  atualizado_em: string;
  signed_url: string | null;
  signed_download_url: string | null;
};

type ArvoreNode = {
  nome: string;
  caminho: string;
  filhos: Map<string, ArvoreNode>;
  ehFolha: boolean;
};

const MESES_CEJAS = [
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

const TIPOS = [
  "Todos",
  "Boleto",
  "Demonstrativo",
  "Orçamento",
  "Contrato",
  "Comprovante",
  "Nota Fiscal",
  "Imagem",
  "Planilha",
  "Documento",
  "Outros"
];

const css = `
.cejas-servidor-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255,97,210,.12), transparent 30%),
    radial-gradient(circle at top left, rgba(123,97,255,.12), transparent 26%),
    #050507;
  color: #f8fafc;
  padding: 22px;
}

.cejas-servidor-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.cejas-servidor-kicker {
  text-transform: uppercase;
  letter-spacing: .38em;
  color: #a78bfa;
  font-size: 11px;
  font-weight: 900;
  margin-bottom: 6px;
}

.cejas-servidor-top h1 {
  margin: 0;
  font-size: 31px;
  letter-spacing: -0.05em;
  color: #fff;
}

.cejas-servidor-top p {
  margin: 7px 0 0;
  color: #a1a1aa;
  font-size: 14px;
}

.cejas-top-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.cejas-btn {
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 11px;
  background: #14151d;
  color: #fff;
  padding: 11px 14px;
  font-weight: 900;
  cursor: pointer;
  font-size: 12px;
}

.cejas-btn.primary {
  border: 0;
  background: linear-gradient(135deg, #7B61FF, #FF61D2);
  box-shadow: 0 12px 30px rgba(255,97,210,.14);
}

.cejas-btn.blue {
  border: 0;
  background: #2563eb;
}

.cejas-btn.red {
  color: #fecaca;
  border-color: rgba(248,113,113,.25);
  background: rgba(127,29,29,.35);
}

.cejas-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.cejas-servidor-grid {
  display: grid;
  grid-template-columns: 420px minmax(0,1fr);
  gap: 20px;
  align-items: start;
}

.cejas-side {
  display: grid;
  gap: 16px;
}

.cejas-panel {
  border: 1px solid rgba(255,255,255,.09);
  background: rgba(17,17,24,.92);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(0,0,0,.28);
  overflow: hidden;
}

.cejas-upload-box {
  border: 1px dashed rgba(167,139,250,.85);
  background: linear-gradient(180deg, rgba(123,97,255,.12), rgba(255,97,210,.04));
  border-radius: 18px;
  padding: 24px;
  margin: 16px;
  text-align: center;
}

.cejas-upload-box h2 {
  margin: 0 0 9px;
  font-size: 18px;
}

.cejas-upload-box p {
  margin: 0 auto 18px;
  max-width: 330px;
  color: #cbd5e1;
  line-height: 1.45;
}

.cejas-upload-actions {
  display: grid;
  gap: 12px;
}

.cejas-upload-btn {
  width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 15px 18px;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  background: linear-gradient(135deg, #7B61FF, #FF61D2);
}

.cejas-upload-btn.secondary {
  background: #1f2a3d;
  border: 1px solid rgba(148,163,184,.25);
}

.cejas-drop-hint {
  margin-top: 14px;
  border: 1px dashed rgba(255,255,255,.13);
  border-radius: 14px;
  padding: 14px;
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.4;
}

.cejas-selected {
  margin-top: 14px;
  color: #e5e7eb;
  font-size: 13px;
}

.cejas-config {
  padding: 16px;
}

.cejas-section-title {
  margin: 0 0 12px;
  color: #e5e7eb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .24em;
  font-weight: 900;
}

.cejas-radio-card {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 8px;
  align-items: start;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.035);
  border-radius: 13px;
  padding: 13px;
  margin-bottom: 10px;
  cursor: pointer;
}

.cejas-radio-card.active {
  border-color: rgba(255,97,210,.55);
  background: rgba(255,97,210,.08);
}

.cejas-radio-card strong {
  display: block;
  color: #fff;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .14em;
}

.cejas-radio-card span {
  display: block;
  color: #a1a1aa;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.35;
}

.cejas-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cejas-field {
  display: grid;
  gap: 7px;
  margin-bottom: 11px;
}

.cejas-field label {
  color: #a1a1aa;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .16em;
  font-weight: 900;
}

.cejas-field input,
.cejas-field select,
.cejas-search {
  width: 100%;
  border: 1px solid rgba(255,255,255,.1);
  background: #0e1017;
  color: #fff;
  border-radius: 11px;
  padding: 12px 13px;
  outline: 0;
}

.cejas-send-actions {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.cejas-info-card {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,.08);
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.45;
}

.cejas-info-card strong {
  color: #fff;
  display: block;
  margin-bottom: 8px;
}

.cejas-main {
  min-width: 0;
}

.cejas-main-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.cejas-main-head h2 {
  margin: 0;
  font-size: 18px;
}

.cejas-main-head p {
  margin: 6px 0 0;
  color: #a1a1aa;
  font-size: 13px;
}

.cejas-search-wrap {
  min-width: 330px;
}

.cejas-main-body {
  padding: 20px;
}

.cejas-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.cejas-metric {
  border: 1px solid rgba(255,255,255,.08);
  background: #0c0d12;
  border-radius: 16px;
  padding: 18px;
}

.cejas-metric span {
  display: block;
  color: #a1a1aa;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .18em;
  font-weight: 900;
}

.cejas-metric strong {
  display: block;
  font-size: 26px;
  margin-top: 8px;
  color: #fff;
}

.cejas-alert {
  border: 1px solid rgba(96,165,250,.2);
  background: rgba(37,99,235,.13);
  color: #bfdbfe;
  border-radius: 14px;
  padding: 13px 15px;
  margin-bottom: 14px;
  font-size: 13px;
}

.cejas-alert.error {
  border-color: rgba(248,113,113,.22);
  background: rgba(127,29,29,.32);
  color: #fecaca;
}

.cejas-empty {
  border: 1px dashed rgba(255,255,255,.11);
  border-radius: 14px;
  padding: 18px;
  color: #a1a1aa;
  text-align: center;
  font-size: 13px;
}

.cejas-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 8px;
  background: rgba(123,97,255,.16);
  color: #ddd6fe;
  font-size: 11px;
  font-weight: 900;
}

.cejas-tag.ok {
  background: rgba(16,185,129,.13);
  color: #86efac;
}

.cejas-tag.warn {
  background: rgba(245,158,11,.13);
  color: #fcd34d;
}

.cejas-tag.danger {
  background: rgba(239,68,68,.14);
  color: #fca5a5;
}

.cejas-meta {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  color: #a1a1aa;
  font-size: 12px;
}

.cejas-file-actions {
  display: flex;
  gap: 7px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.cejas-mini {
  border: 0;
  border-radius: 9px;
  padding: 8px 10px;
  color: #fff;
  background: #1f2937;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.cejas-mini.blue {
  background: #2563eb;
}

.cejas-mini.red {
  background: #ef4444;
}

.cejas-explorer {
  display: grid;
  grid-template-columns: 300px minmax(0,1fr);
  border-top: 1px solid rgba(255,255,255,.08);
}

.cejas-tree {
  border-right: 1px solid rgba(255,255,255,.08);
  padding: 14px 8px;
  overflow-y: auto;
  max-height: 760px;
}

.cejas-tree-item {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  border: 0;
  background: transparent;
  color: #d4d4d8;
  text-align: left;
  padding: 8px 10px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.cejas-tree-item:hover {
  background: rgba(255,255,255,.05);
}

.cejas-tree-item.active {
  background: linear-gradient(135deg, rgba(123,97,255,.4), rgba(255,97,210,.22));
  color: #fff;
}

.cejas-tree-arrow {
  width: 12px;
  flex: 0 0 auto;
  color: #a78bfa;
  font-size: 10px;
}

.cejas-tree-icon {
  flex: 0 0 auto;
}

.cejas-tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cejas-tree-count {
  margin-left: auto;
  flex: 0 0 auto;
  color: #71717a;
  font-size: 11px;
  font-weight: 900;
}

.cejas-tree-empty {
  color: #71717a;
  font-size: 13px;
  padding: 14px 10px;
}

.cejas-files-panel {
  padding: 20px;
  overflow-y: auto;
  max-height: 760px;
  min-width: 0;
}

.cejas-breadcrumb {
  color: #a78bfa;
  font-weight: 900;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: .06em;
  margin: 0 0 4px;
  word-break: break-word;
}

.cejas-files-count {
  color: #71717a;
  font-size: 12px;
  margin-bottom: 18px;
}

.cejas-file-row {
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.cejas-file-row:last-child {
  border-bottom: 0;
}

.cejas-file-row h4 {
  margin: 0 0 8px;
  color: #fff;
  font-size: 14px;
  word-break: break-word;
}

@media (max-width: 1180px) {
  .cejas-servidor-grid {
    grid-template-columns: 1fr;
  }

  .cejas-metrics {
    grid-template-columns: 1fr;
  }

  .cejas-main-head {
    display: grid;
  }

  .cejas-search-wrap {
    min-width: 0;
  }

  .cejas-explorer {
    grid-template-columns: 1fr;
  }

  .cejas-tree {
    max-height: 320px;
    border-right: 0;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }
}
`;

function anoAtual() {
  return String(new Date().getFullYear());
}

function formatarTamanho(bytes: number | null) {
  if (!bytes) return "0 MB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function totalMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatarDataEvento(data: string | null) {
  if (!data) return "Sem data";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}.${mes}.${ano}`;
}

function statusClass(status: string | null) {
  if (status === "classificado") return "cejas-tag ok";
  if (status === "invalido") return "cejas-tag danger";
  return "cejas-tag warn";
}

function pastaKey(arquivo: ArquivoServidor) {
  if (arquivo.status_classificacao && arquivo.status_classificacao !== "classificado") {
    return `VERIFICAR / ${arquivo.mes || "SEM MÊS"}`;
  }
  return `${arquivo.ano} / ${arquivo.mes} / ${arquivo.evento}`;
}

function construirArvore(grupos: Array<[string, ArquivoServidor[]]>): ArvoreNode {
  const raiz: ArvoreNode = { nome: "", caminho: "", filhos: new Map(), ehFolha: false };

  grupos.forEach(([pasta]) => {
    const partes = pasta.split(" / ");
    let atual = raiz;
    let caminhoAcumulado = "";

    partes.forEach((parte) => {
      caminhoAcumulado = caminhoAcumulado ? `${caminhoAcumulado} / ${parte}` : parte;
      if (!atual.filhos.has(parte)) {
        atual.filhos.set(parte, { nome: parte, caminho: caminhoAcumulado, filhos: new Map(), ehFolha: false });
      }
      atual = atual.filhos.get(parte) as ArvoreNode;
    });

    atual.ehFolha = true;
  });

  return raiz;
}

function ordenarFilhos(node: ArvoreNode, raiz: boolean): ArvoreNode[] {
  const filhos = Array.from(node.filhos.values());
  return filhos.sort((a, b) => {
    if (raiz) {
      if (a.nome === "VERIFICAR") return 1;
      if (b.nome === "VERIFICAR") return -1;
    }
    if (a.nome === "SEM MÊS") return 1;
    if (b.nome === "SEM MÊS") return -1;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

function ArvoreView({
  node,
  raiz,
  depth,
  expandidos,
  onToggle,
  selecionado,
  onSelecionar,
  contagem
}: {
  node: ArvoreNode;
  raiz: boolean;
  depth: number;
  expandidos: Set<string>;
  onToggle: (caminho: string) => void;
  selecionado: string | null;
  onSelecionar: (caminho: string) => void;
  contagem: Map<string, number>;
}) {
  const filhos = ordenarFilhos(node, raiz);

  return (
    <>
      {filhos.map((filho) => {
        const temFilhos = filho.filhos.size > 0;
        const aberto = expandidos.has(filho.caminho);
        const ativo = filho.caminho === selecionado;

        return (
          <div key={filho.caminho}>
            <button
              type="button"
              className={`cejas-tree-item ${ativo ? "active" : ""}`}
              style={{ paddingLeft: 10 + depth * 16 }}
              onClick={() => {
                if (temFilhos) onToggle(filho.caminho);
                if (filho.ehFolha) onSelecionar(filho.caminho);
              }}
            >
              {temFilhos ? <span className="cejas-tree-arrow">{aberto ? "▾" : "▸"}</span> : <span className="cejas-tree-arrow" />}
              <span className="cejas-tree-icon">📁</span>
              <span className="cejas-tree-label">{filho.nome}</span>
              {filho.ehFolha && <span className="cejas-tree-count">{contagem.get(filho.caminho) || 0}</span>}
            </button>

            {temFilhos && aberto && (
              <ArvoreView
                node={filho}
                raiz={false}
                depth={depth + 1}
                expandidos={expandidos}
                onToggle={onToggle}
                selecionado={selecionado}
                onSelecionar={onSelecionar}
                contagem={contagem}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export default function ServidorPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [arquivos, setArquivos] = useState<ArquivoServidor[]>([]);
  const [selecionados, setSelecionados] = useState<File[]>([]);
  const [modo, setModo] = useState<"inteligente" | "original" | "manual">("inteligente");
  const [modoDuplicado, setModoDuplicado] = useState<"replace" | "keep" | "skip">("replace");
  const [anoPadrao, setAnoPadrao] = useState(anoAtual());
  const [mesManual, setMesManual] = useState("06 JUNHO");
  const [eventoManual, setEventoManual] = useState("");
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [pastaSelecionada, setPastaSelecionada] = useState<string | null>(null);
  const jaExpandiuRaizes = useRef(false);

  const carregarArquivos = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const params = new URLSearchParams();
      if (busca) params.set("busca", busca);
      if (tipo !== "Todos") params.set("tipo", tipo);

      const response = await fetch(`/api/servidor/arquivos?${params.toString()}`);
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const texto = await response.text();
        throw new Error(`A API retornou HTML ou texto em vez de JSON. Status ${response.status}. ${texto.slice(0, 80)}`);
      }

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.erro || "Falha ao carregar servidor.");
      }

      setArquivos(data.arquivos || []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar servidor.");
    } finally {
      setCarregando(false);
    }
  }, [busca, tipo]);

  useEffect(() => {
    carregarArquivos();
  }, [carregarArquivos]);

  const totalBytes = useMemo(() => {
    return arquivos.reduce((acc, arquivo) => acc + Number(arquivo.tamanho || 0), 0);
  }, [arquivos]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, ArquivoServidor[]>();

    arquivos.forEach((arquivo) => {
      const key = pastaKey(arquivo);
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key)?.push(arquivo);
    });

    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [arquivos]);

  const mapaPorPasta = useMemo(() => new Map(grupos), [grupos]);
  const contagem = useMemo(() => new Map(grupos.map(([pasta, itens]) => [pasta, itens.length])), [grupos]);
  const arvore = useMemo(() => construirArvore(grupos), [grupos]);

  useEffect(() => {
    if (jaExpandiuRaizes.current || arvore.filhos.size === 0) return;
    jaExpandiuRaizes.current = true;
    setExpandidos(new Set(Array.from(arvore.filhos.values()).map((n) => n.caminho)));
  }, [arvore]);

  useEffect(() => {
    if (pastaSelecionada && !mapaPorPasta.has(pastaSelecionada)) {
      setPastaSelecionada(null);
    }
  }, [pastaSelecionada, mapaPorPasta]);

  const arquivosDaPastaSelecionada = pastaSelecionada ? mapaPorPasta.get(pastaSelecionada) || [] : [];

  function alternarExpandido(caminho: string) {
    setExpandidos((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(caminho)) proximo.delete(caminho);
      else proximo.add(caminho);
      return proximo;
    });
  }

  function abrirSeletor(modoSelecao: "arquivo" | "pasta" | "zip") {
    const input = inputRef.current;
    if (!input) return;

    input.value = "";
    input.multiple = true;

    if (modoSelecao === "zip") {
      input.accept = ".zip";
    } else {
      input.accept = "";
    }

    if (modoSelecao === "pasta") {
      input.setAttribute("webkitdirectory", "true");
      input.setAttribute("directory", "true");
    } else {
      input.removeAttribute("webkitdirectory");
      input.removeAttribute("directory");
    }

    input.click();
  }

  function receberSelecao(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSelecionados(Array.from(files));
    setMensagem(`${files.length} arquivo(s) selecionado(s).`);
    setErro("");
  }

  async function enviarParaServidor() {
    if (selecionados.length === 0) {
      setErro("Selecione arquivos antes de enviar.");
      return;
    }

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      setErro("NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada na Vercel. Adicione essa variável de ambiente e faça um novo deploy.");
      return;
    }

    setEnviando(true);
    setErro("");

    const total = selecionados.length;
    let enviados = 0;
    let ignorados = 0;
    const falhas: string[] = [];

    for (const file of selecionados) {
      const relativePath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

      setMensagem(`Enviando ${enviados + 1} de ${total}: ${file.name}...`);

      try {
        const signResponse = await fetch("/api/servidor/arquivos/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            relativePath,
            ano: anoPadrao,
            mes: modo === "manual" ? mesManual : "",
            evento: modo === "manual" ? eventoManual.toUpperCase() : "",
            modoOrganizacao: modo,
            duplicateMode: modoDuplicado
          })
        });

        const signJson = await signResponse.json();
        if (!signJson.ok) throw new Error(signJson.erro || `Falha ao preparar envio de ${file.name}`);

        if (signJson.skip) {
          ignorados += 1;
          enviados += 1;
          continue;
        }

        const putResponse = await fetch(signJson.signedUrl, {
          method: "PUT",
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            "content-type": file.type || "application/octet-stream",
            "x-upsert": "true"
          },
          body: file
        });

        if (!putResponse.ok) throw new Error(`Falha ao enviar ${file.name} para o Storage (HTTP ${putResponse.status}).`);

        const finalizeResponse = await fetch("/api/servidor/arquivos/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: signJson.path,
            destino: signJson.destino,
            usuarioNome: "Eduardo",
            modoOrganizacao: modo,
            relativePath,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          })
        });

        const finalizeJson = await finalizeResponse.json();
        if (!finalizeJson.ok) throw new Error(finalizeJson.erro || `Falha ao registrar ${file.name}`);

        enviados += 1;
      } catch (error) {
        falhas.push(`${file.name}: ${error instanceof Error ? error.message : "erro desconhecido"}`);
      }
    }

    setEnviando(false);
    setSelecionados([]);

    if (falhas.length === 0) {
      setMensagem(`Upload concluído. ${enviados} arquivo(s) enviado(s)${ignorados ? ` (${ignorados} ignorado(s) por já existir)` : ""}.`);
    } else {
      setErro(`${falhas.length} de ${total} arquivo(s) falharam: ${falhas.slice(0, 5).join(" | ")}${falhas.length > 5 ? "..." : ""}`);
      if (enviados > 0) setMensagem(`${enviados} de ${total} arquivo(s) enviado(s) com sucesso.`);
    }

    await carregarArquivos();
  }

  async function moverArquivo(arquivo: ArquivoServidor) {
    const ano = window.prompt("Ano da pasta (ex: 2026):", arquivo.ano || anoAtual());
    if (!ano) return;

    const mes = window.prompt(
      `Mês da pasta, use um destes valores:\n${MESES_CEJAS.join(", ")}`,
      arquivo.mes || "01 JANEIRO"
    );
    if (!mes) return;

    const evento = window.prompt("Nome do evento/pasta (ex: WEG 23.01):", arquivo.evento || "");
    if (!evento) return;

    const response = await fetch("/api/servidor/arquivos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: arquivo.id, ano, mes, evento })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      setErro(data.erro || "Falha ao mover arquivo.");
      return;
    }

    setMensagem(`Arquivo movido para ${ano} / ${mes} / ${evento.toUpperCase()}.`);
    await carregarArquivos();
  }

  async function excluirArquivo(id: string) {
    const confirma = window.confirm("Excluir este arquivo do Supabase Storage e da tabela?");
    if (!confirma) return;

    const response = await fetch(`/api/servidor/arquivos?id=${id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      setErro(data.erro || "Falha ao excluir arquivo.");
      return;
    }

    setMensagem("Arquivo excluído.");
    await carregarArquivos();
  }

  async function apagarTudo() {
    const confirma = window.confirm(
      "Isso vai apagar TODOS os arquivos de teste do Supabase Storage e da tabela. Deseja continuar?"
    );

    if (!confirma) return;

    const segundaConfirmacao = window.confirm(
      "Confirma mesmo? Essa limpeza remove os arquivos salvos no servidor."
    );

    if (!segundaConfirmacao) return;

    setErro("");
    setMensagem("Apagando arquivos do servidor...");

    const response = await fetch("/api/servidor/arquivos?scope=all", {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      setErro(data.erro || "Falha ao apagar arquivos.");
      return;
    }

    setMensagem(`Limpeza concluída. ${data.removidos || 0} arquivo(s) removido(s).`);
    setPastaSelecionada(null);
    await carregarArquivos();
  }

  return (
    <div className="cejas-servidor-page">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(event) => receberSelecao(event.target.files)}
      />

      <header className="cejas-servidor-top">
        <div>
          <div className="cejas-servidor-kicker">Servidor interno CEJAS</div>
          <h1>Servidor de Arquivos</h1>
          <p>Guarde aqui pastas completas com orçamentos, boletos, demonstrativos e documentos dos eventos.</p>
        </div>

        <div className="cejas-top-actions">
          <button className="cejas-btn" type="button" onClick={carregarArquivos}>Atualizar</button>
          <button className="cejas-btn primary" type="button" onClick={() => window.location.href = "/dashboard"}>Voltar ao painel</button>
          <button className="cejas-btn red" type="button" onClick={apagarTudo}>Apagar tudo</button>
          <button className="cejas-btn primary" type="button" onClick={() => abrirSeletor("zip")}>Enviar ZIP em lotes</button>
        </div>
      </header>

      <section className="cejas-servidor-grid">
        <aside className="cejas-side">
          <div className="cejas-panel">
            <div className="cejas-upload-box">
              <h2>Subir arquivos e pastas</h2>
              <p>
                Envie vários arquivos soltos, uma pasta completa ou arraste várias pastas/arquivos ao mesmo tempo.
                No modo inteligente, arquivos do mesmo evento (orçamento, contrato, boleto, demonstrativo...) caem juntos na mesma pasta.
              </p>

              <div className="cejas-upload-actions">
                <button className="cejas-upload-btn" type="button" onClick={() => abrirSeletor("pasta")}>
                  📁 Selecionar pasta
                </button>

                <button className="cejas-upload-btn secondary" type="button" onClick={() => abrirSeletor("arquivo")}>
                  📄 Selecionar vários arquivos soltos
                </button>
              </div>

              <div className="cejas-drop-hint">
                Ou arraste aqui várias pastas e arquivos juntos. Essa é a melhor opção para enviar mais de uma pasta ao mesmo tempo.
              </div>

              <div className="cejas-selected">
                {selecionados.length === 0 ? "Nenhum arquivo selecionado." : `${selecionados.length} arquivo(s) selecionado(s).`}
              </div>
            </div>
          </div>

          <div className="cejas-panel cejas-config">
            <h3 className="cejas-section-title">Forma de organização</h3>

            <label className={`cejas-radio-card ${modo === "inteligente" ? "active" : ""}`}>
              <input type="radio" checked={modo === "inteligente"} onChange={() => setModo("inteligente")} />
              <span>
                <strong>Organizar automaticamente por evento, mês e data</strong>
                <span>Recomendado. O sistema identifica tipo (boleto, contrato, orçamento, demonstrativo...), evento e data, e agrupa tudo do mesmo evento numa pasta só.</span>
              </span>
            </label>

            <label className={`cejas-radio-card ${modo === "original" ? "active" : ""}`}>
              <input type="radio" checked={modo === "original"} onChange={() => setModo("original")} />
              <span>
                <strong>Enviar mantendo a pasta original</strong>
                <span>Ideal para quando a pasta já veio organizada e você quer preservar a lógica.</span>
              </span>
            </label>

            <label className={`cejas-radio-card ${modo === "manual" ? "active" : ""}`}>
              <input type="radio" checked={modo === "manual"} onChange={() => setModo("manual")} />
              <span>
                <strong>Enviar manualmente dentro de ano / mês / evento</strong>
                <span>Use quando quiser forçar todos os arquivos para uma pasta de evento específica.</span>
              </span>
            </label>

            <div className="cejas-field">
              <label>Ano padrão quando o nome do arquivo não trouxer ano</label>
              <input value={anoPadrao} onChange={(event) => setAnoPadrao(event.target.value)} />
            </div>

            <div className="cejas-field">
              <label>Arquivos com mesmo nome na mesma pasta</label>
              <select value={modoDuplicado} onChange={(event) => setModoDuplicado(event.target.value as "replace" | "keep" | "skip")}>
                <option value="replace">Substituir o arquivo antigo</option>
                <option value="keep">Manter os dois e criar (2)</option>
                <option value="skip">Ignorar se já existir</option>
              </select>
            </div>

            {modo === "manual" && (
              <>
                <div className="cejas-form-grid">
                  <div className="cejas-field">
                    <label>Mês</label>
                    <select value={mesManual} onChange={(event) => setMesManual(event.target.value)}>
                      {MESES_CEJAS.map((mes) => (
                        <option key={mes} value={mes}>{mes}</option>
                      ))}
                    </select>
                  </div>

                  <div className="cejas-field">
                    <label>Ano</label>
                    <input value={anoPadrao} onChange={(event) => setAnoPadrao(event.target.value)} />
                  </div>
                </div>

                <div className="cejas-field">
                  <label>Evento</label>
                  <input
                    placeholder="APRESENTAÇÃO DE RESULTADOS CLINICORP - 30.06"
                    value={eventoManual}
                    onChange={(event) => setEventoManual(event.target.value)}
                  />
                </div>
              </>
            )}

            <div className="cejas-send-actions">
              <button className="cejas-btn primary" type="button" disabled={enviando} onClick={enviarParaServidor}>
                {enviando ? "Enviando..." : "Enviar para o servidor"}
              </button>

              <button className="cejas-btn" type="button" onClick={() => setSelecionados([])}>
                Limpar seleção
              </button>
            </div>
          </div>

          <div className="cejas-panel">
            <div className="cejas-info-card">
              <strong>Regra principal: Ano &gt; Mês &gt; Evento &gt; Arquivos</strong>
              Tudo do mesmo evento (orçamento, contrato, boleto, demonstrativo) fica dentro da pasta do próprio evento.
              Ex: 2026 / 06 JUNHO / APRESENTAÇÃO DE RESULTADOS CLINICORP 06.06 / boleto.pdf. Arquivos que o sistema não entender entram em VERIFICAR.
            </div>

            <div className="cejas-info-card">
              <strong>Acesso</strong>
              Esta página fica protegida pelo login do sistema. Qualquer usuário com acesso poderá consultar os arquivos conforme permissão.
            </div>
          </div>
        </aside>

        <main className="cejas-panel cejas-main">
          <div className="cejas-main-head">
            <div>
              <h2>Arquivos salvos</h2>
              <p>Clique numa pasta à esquerda para ver os arquivos dela.</p>
            </div>

            <div className="cejas-search-wrap">
              <input
                className="cejas-search"
                placeholder="Buscar pasta ou arquivo..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />

              <div style={{ marginTop: 10 }}>
                <select className="cejas-search" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                  {TIPOS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="cejas-main-body">
            {mensagem && <div className="cejas-alert">{mensagem}</div>}
            {erro && <div className="cejas-alert error">{erro}</div>}

            <div className="cejas-metrics">
              <div className="cejas-metric">
                <span>Pastas</span>
                <strong>{grupos.length}</strong>
              </div>

              <div className="cejas-metric">
                <span>Arquivos</span>
                <strong>{arquivos.length}</strong>
              </div>

              <div className="cejas-metric">
                <span>Tamanho</span>
                <strong>{totalMB(totalBytes)}</strong>
              </div>
            </div>
          </div>

          {carregando ? (
            <div className="cejas-empty" style={{ margin: 20 }}>Carregando servidor...</div>
          ) : arquivos.length === 0 ? (
            <div className="cejas-empty" style={{ margin: 20 }}>Nenhum arquivo salvo no servidor ainda.</div>
          ) : (
            <div className="cejas-explorer">
              <nav className="cejas-tree">
                {arvore.filhos.size === 0 ? (
                  <div className="cejas-tree-empty">Nenhuma pasta encontrada.</div>
                ) : (
                  <ArvoreView
                    node={arvore}
                    raiz
                    depth={0}
                    expandidos={expandidos}
                    onToggle={alternarExpandido}
                    selecionado={pastaSelecionada}
                    onSelecionar={setPastaSelecionada}
                    contagem={contagem}
                  />
                )}
              </nav>

              <div className="cejas-files-panel">
                {!pastaSelecionada ? (
                  <div className="cejas-empty">Selecione uma pasta à esquerda para ver os arquivos.</div>
                ) : (
                  <>
                    <p className="cejas-breadcrumb">{pastaSelecionada.replace(/ \/ /g, " › ")}</p>
                    <p className="cejas-files-count">{arquivosDaPastaSelecionada.length} arquivo(s)</p>

                    {arquivosDaPastaSelecionada.map((arquivo) => (
                      <article className="cejas-file-row" key={arquivo.id}>
                        <div>
                          <h4>📄 {arquivo.nome}</h4>

                          <div className="cejas-meta">
                            <span className="cejas-tag">{arquivo.tipo_identificado}</span>
                            {arquivo.status_classificacao !== "classificado" && (
                              <span className={statusClass(arquivo.status_classificacao)}>
                                {arquivo.status_classificacao}
                              </span>
                            )}
                            <span>{formatarDataEvento(arquivo.data_evento)}</span>
                            <span>{formatarTamanho(arquivo.tamanho)}</span>
                            <span>{arquivo.usuario_nome || "Sistema"}</span>
                          </div>
                        </div>

                        <div className="cejas-file-actions">
                          <button
                            className="cejas-mini blue"
                            type="button"
                            disabled={!arquivo.signed_url}
                            onClick={() => arquivo.signed_url && window.open(arquivo.signed_url, "_blank")}
                          >
                            Visualizar
                          </button>

                          <button
                            className="cejas-mini"
                            type="button"
                            disabled={!arquivo.signed_download_url}
                            onClick={() => arquivo.signed_download_url && window.open(arquivo.signed_download_url, "_blank")}
                          >
                            Baixar
                          </button>

                          <button className="cejas-mini" type="button" onClick={() => alert("Renomear entra na próxima etapa.")}>
                            Renomear
                          </button>

                          <button className="cejas-mini" type="button" onClick={() => moverArquivo(arquivo)}>
                            Mover
                          </button>

                          <button className="cejas-mini red" type="button" onClick={() => excluirArquivo(arquivo.id)}>
                            Excluir
                          </button>
                        </div>
                      </article>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
