"use client";

import { useMemo, useRef, useState } from "react";
import {
  MESES_CEJAS,
  classificarArquivoServidor,
  type ClassificacaoArquivoServidor
} from "@/lib/servidor/classificacao";

type ArquivoLocalServidor = ClassificacaoArquivoServidor & {
  id: string;
  nome: string;
  nomeOriginal: string;
  tamanho: number;
  tipoMime: string;
  enviadoPor: string;
  criadoEm: string;
};

type PastaAtual = {
  ano: string;
  mes: string;
  evento: string;
};

const tipos = [
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
  background: #0b0b10;
  color: #f8fafc;
  padding: 22px;
}

.cejas-servidor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 18px;
}

.cejas-servidor-header h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.04em;
}

.cejas-servidor-header p {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 14px;
}

.cejas-servidor-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.cejas-server-btn {
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 11px;
  background: #15151d;
  color: #fff;
  padding: 11px 14px;
  font-weight: 900;
  cursor: pointer;
  font-size: 12px;
}

.cejas-server-btn.primary {
  background: linear-gradient(135deg, #7B61FF, #FF61D2);
  border: 0;
}

.cejas-server-btn.blue {
  background: #2563eb;
  border: 0;
}

.cejas-server-btn:hover {
  filter: brightness(1.08);
}

.cejas-server-filters {
  display: grid;
  grid-template-columns: 120px 170px minmax(180px,1fr) 170px 130px;
  gap: 10px;
  margin-bottom: 16px;
}

.cejas-server-filters input,
.cejas-server-filters select {
  width: 100%;
  border: 1px solid rgba(255,255,255,.11);
  background: #12121a;
  color: #fff;
  border-radius: 11px;
  padding: 11px 12px;
  outline: 0;
}

.cejas-server-grid {
  display: grid;
  grid-template-columns: 340px minmax(0,1fr);
  gap: 16px;
  height: calc(100vh - 170px);
  min-height: 620px;
}

.cejas-server-panel {
  background: #111118;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,.26);
}

.cejas-server-panel-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: #151520;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cejas-server-panel-header strong {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: .12em;
}

.cejas-folder-tree {
  padding: 14px;
  overflow: auto;
  height: calc(100% - 54px);
}

.cejas-tree-root {
  font-weight: 900;
  color: #fff;
  margin-bottom: 14px;
}

.cejas-tree-year {
  margin: 12px 0;
}

.cejas-tree-year > button,
.cejas-tree-month > button,
.cejas-tree-event {
  width: 100%;
  border: 0;
  background: transparent;
  color: #e5e7eb;
  text-align: left;
  cursor: pointer;
  padding: 8px 9px;
  border-radius: 10px;
  font-weight: 800;
}

.cejas-tree-year > button:hover,
.cejas-tree-month > button:hover,
.cejas-tree-event:hover {
  background: rgba(255,255,255,.06);
}

.cejas-tree-month {
  margin-left: 12px;
}

.cejas-tree-event {
  margin-left: 24px;
  color: #c4b5fd;
  font-size: 12px;
  line-height: 1.3;
}

.cejas-tree-special {
  margin-top: 18px;
  border-top: 1px solid rgba(255,255,255,.08);
  padding-top: 14px;
}

.cejas-files-area {
  padding: 16px;
  overflow: auto;
  height: calc(100% - 54px);
  background: #0f1018;
}

.cejas-current-path {
  background: #171827;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
  color: #cbd5e1;
}

.cejas-current-path strong {
  display: block;
  color: #fff;
  margin-bottom: 5px;
}

.cejas-empty-state {
  border: 1px dashed rgba(255,255,255,.18);
  border-radius: 16px;
  padding: 34px;
  text-align: center;
  color: #94a3b8;
  background: rgba(255,255,255,.025);
}

.cejas-file-list {
  display: grid;
  gap: 12px;
}

.cejas-file-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 16px;
  padding: 14px;
  background: #151620;
}

.cejas-file-card h3 {
  margin: 0 0 7px;
  font-size: 15px;
  color: #fff;
}

.cejas-file-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  color: #94a3b8;
  font-size: 12px;
}

.cejas-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 8px;
  background: rgba(123,97,255,.15);
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
  background: rgba(239,68,68,.13);
  color: #fca5a5;
}

.cejas-file-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.cejas-mini-action {
  border: 0;
  border-radius: 9px;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
  background: #1f2937;
  color: #fff;
}

.cejas-mini-action.blue {
  background: #2563eb;
}

.cejas-mini-action.red {
  background: #ef4444;
}

.cejas-path-line {
  margin-top: 8px;
  color: #64748b;
  font-size: 11px;
  word-break: break-all;
}

.cejas-server-note {
  margin-top: 14px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 1100px) {
  .cejas-server-grid,
  .cejas-server-filters {
    grid-template-columns: 1fr;
    height: auto;
  }

  .cejas-server-panel {
    min-height: 420px;
  }
}
`;

function formatarTamanho(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function anoAtual(): string {
  return String(new Date().getFullYear());
}

export default function ServidorPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [arquivos, setArquivos] = useState<ArquivoLocalServidor[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroAno, setFiltroAno] = useState(anoAtual());
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [pastaAtual, setPastaAtual] = useState<PastaAtual>({
    ano: anoAtual(),
    mes: "06 JUNHO",
    evento: ""
  });

  const anos = useMemo(() => {
    const base = new Set([anoAtual(), "2026", "2027", ...arquivos.map((arquivo) => arquivo.ano).filter(Boolean)]);
    return Array.from(base).sort();
  }, [arquivos]);

  const eventosPorMes = useMemo(() => {
    const mapa = new Map<string, Set<string>>();

    arquivos.forEach((arquivo) => {
      if (!arquivo.ano || !arquivo.mes || !arquivo.evento) return;
      const chave = `${arquivo.ano}|${arquivo.mes}`;
      if (!mapa.has(chave)) mapa.set(chave, new Set());
      mapa.get(chave)?.add(arquivo.evento);
    });

    return mapa;
  }, [arquivos]);

  const arquivosFiltrados = useMemo(() => {
    return arquivos.filter((arquivo) => {
      const texto = `${arquivo.nome} ${arquivo.tipo} ${arquivo.evento} ${arquivo.caminhoStorage}`.toLowerCase();

      if (busca && !texto.includes(busca.toLowerCase())) return false;
      if (filtroAno && arquivo.ano !== filtroAno) return false;
      if (filtroMes && arquivo.mes !== filtroMes) return false;
      if (filtroEvento && !arquivo.evento.toLowerCase().includes(filtroEvento.toLowerCase())) return false;
      if (filtroTipo !== "Todos" && arquivo.tipo !== filtroTipo) return false;

      if (pastaAtual.evento) {
        return arquivo.ano === pastaAtual.ano && arquivo.mes === pastaAtual.mes && arquivo.evento === pastaAtual.evento;
      }

      if (pastaAtual.mes) {
        return arquivo.ano === pastaAtual.ano && arquivo.mes === pastaAtual.mes;
      }

      return arquivo.ano === pastaAtual.ano;
    });
  }, [arquivos, busca, filtroAno, filtroMes, filtroEvento, filtroTipo, pastaAtual]);

  function abrirSeletorArquivo(modo: "arquivo" | "varios" | "pasta") {
    const input = inputRef.current;
    if (!input) return;

    input.value = "";
    input.multiple = modo !== "arquivo";

    if (modo === "pasta") {
      input.setAttribute("webkitdirectory", "true");
      input.setAttribute("directory", "true");
    } else {
      input.removeAttribute("webkitdirectory");
      input.removeAttribute("directory");
    }

    input.click();
  }

  function receberArquivos(files: FileList | null) {
    if (!files || files.length === 0) return;

    const novos: ArquivoLocalServidor[] = Array.from(files).map((file) => {
      const classificacao = classificarArquivoServidor(file.name, filtroAno || anoAtual(), pastaAtual);

      return {
        id: `${Date.now()}-${Math.random()}`,
        nome: file.name,
        nomeOriginal: file.name,
        tamanho: file.size,
        tipoMime: file.type || "não informado",
        enviadoPor: "Eduardo",
        criadoEm: new Date().toLocaleString("pt-BR"),
        ...classificacao
      };
    });

    setArquivos((atual) => [...novos, ...atual]);
  }

  function criarPastaEvento() {
    const nomeEvento = window.prompt("Nome da pasta do evento no padrão NOME DO EVENTO - DD.MM:");
    if (!nomeEvento) return;

    setPastaAtual({
      ano: filtroAno || anoAtual(),
      mes: filtroMes || "06 JUNHO",
      evento: nomeEvento.toUpperCase()
    });
  }

  function renomearArquivo(id: string) {
    setArquivos((atual) =>
      atual.map((arquivo) => {
        if (arquivo.id !== id) return arquivo;

        const novoNome = window.prompt("Novo nome do arquivo:", arquivo.nome);
        if (!novoNome) return arquivo;

        const novaClassificacao = classificarArquivoServidor(novoNome, arquivo.ano, {
          ano: arquivo.ano,
          mes: arquivo.mes,
          evento: arquivo.evento
        });

        return {
          ...arquivo,
          nome: novoNome,
          ...novaClassificacao
        };
      })
    );
  }

  function excluirArquivo(id: string) {
    setArquivos((atual) => atual.filter((arquivo) => arquivo.id !== id));
  }

  function moverParaVerificar(id: string) {
    setArquivos((atual) =>
      atual.map((arquivo) =>
        arquivo.id === id
          ? {
              ...arquivo,
              status: "verificar",
              caminhoStorage: `_VERIFICAR/arquivos não identificados/${arquivo.nome}`
            }
          : arquivo
      )
    );
  }

  return (
    <div className="cejas-servidor-page">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(event) => receberArquivos(event.target.files)}
      />

      <header className="cejas-servidor-header">
        <div>
          <h1>Servidor de Arquivos</h1>
          <p>Arquivos organizados por ano, mês e evento no Supabase Storage.</p>
        </div>

        <div className="cejas-servidor-actions">
          <button className="cejas-server-btn primary" type="button" onClick={() => abrirSeletorArquivo("arquivo")}>
            Enviar arquivo
          </button>
          <button className="cejas-server-btn" type="button" onClick={() => abrirSeletorArquivo("varios")}>
            Enviar vários arquivos
          </button>
          <button className="cejas-server-btn" type="button" onClick={() => abrirSeletorArquivo("pasta")}>
            Enviar pasta
          </button>
          <button className="cejas-server-btn" type="button" onClick={criarPastaEvento}>
            Criar pasta de evento
          </button>
          <button className="cejas-server-btn blue" type="button" onClick={() => window.location.reload()}>
            Atualizar
          </button>
        </div>
      </header>

      <section className="cejas-server-filters">
        <select value={filtroAno} onChange={(event) => setFiltroAno(event.target.value)}>
          {anos.map((ano) => (
            <option key={ano} value={ano}>{ano}</option>
          ))}
        </select>

        <select value={filtroMes} onChange={(event) => setFiltroMes(event.target.value)}>
          <option value="">Todos os meses</option>
          {MESES_CEJAS.map((mes) => (
            <option key={mes} value={mes}>{mes}</option>
          ))}
        </select>

        <input
          placeholder="Buscar arquivo, evento ou caminho..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />

        <input
          placeholder="Filtrar por evento..."
          value={filtroEvento}
          onChange={(event) => setFiltroEvento(event.target.value)}
        />

        <select value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value)}>
          {tipos.map((tipo) => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </section>

      <section className="cejas-server-grid">
        <aside className="cejas-server-panel">
          <div className="cejas-server-panel-header">
            <strong>Pastas</strong>
            <span className="cejas-tag">{arquivos.length} arquivos</span>
          </div>

          <div className="cejas-folder-tree">
            <div className="cejas-tree-root">SERVIDOR CEJAS</div>

            {anos.map((ano) => (
              <div className="cejas-tree-year" key={ano}>
                <button type="button" onClick={() => setPastaAtual({ ano, mes: "", evento: "" })}>
                  ▼ {ano}
                </button>

                {MESES_CEJAS.map((mes) => {
                  const chave = `${ano}|${mes}`;
                  const eventos = Array.from(eventosPorMes.get(chave) || []);

                  return (
                    <div className="cejas-tree-month" key={`${ano}-${mes}`}>
                      <button type="button" onClick={() => setPastaAtual({ ano, mes, evento: "" })}>
                        ├── {mes}
                      </button>

                      {eventos.map((evento) => (
                        <button
                          key={`${ano}-${mes}-${evento}`}
                          className="cejas-tree-event"
                          type="button"
                          onClick={() => setPastaAtual({ ano, mes, evento })}
                        >
                          └── {evento}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="cejas-tree-special">
              <button type="button" className="cejas-tree-event" onClick={() => setPastaAtual({ ano: "_DOCUMENTOS_FIXOS", mes: "", evento: "" })}>
                ▼ _DOCUMENTOS_FIXOS
              </button>
              <button type="button" className="cejas-tree-event" onClick={() => setPastaAtual({ ano: "_VERIFICAR", mes: "", evento: "" })}>
                ▼ _VERIFICAR
              </button>
            </div>
          </div>
        </aside>

        <main className="cejas-server-panel">
          <div className="cejas-server-panel-header">
            <strong>Arquivos</strong>
            <span className="cejas-tag ok">Modo local de teste</span>
          </div>

          <div className="cejas-files-area">
            <div className="cejas-current-path">
              <strong>Pasta atual:</strong>
              {pastaAtual.ano || "SERVIDOR CEJAS"}
              {pastaAtual.mes ? ` / ${pastaAtual.mes}` : ""}
              {pastaAtual.evento ? ` / ${pastaAtual.evento}` : ""}
              <p className="cejas-server-note">
                Nesta etapa os arquivos são classificados localmente para testar a interface. Depois vamos conectar upload real no bucket <strong>servidor-cejas</strong> e gravar metadados em <strong>cejas_servidor_arquivos</strong>.
              </p>
            </div>

            {arquivosFiltrados.length === 0 ? (
              <div className="cejas-empty-state">
                <h2>Nenhum arquivo nesta pasta.</h2>
                <p>Envie um arquivo solto, vários arquivos ou uma pasta para testar a organização automática.</p>
              </div>
            ) : (
              <div className="cejas-file-list">
                {arquivosFiltrados.map((arquivo) => (
                  <article className="cejas-file-card" key={arquivo.id}>
                    <div>
                      <h3>{arquivo.nome}</h3>

                      <div className="cejas-file-meta">
                        <span className="cejas-tag">{arquivo.tipo}</span>
                        <span className={arquivo.status === "classificado" ? "cejas-tag ok" : arquivo.status === "invalido" ? "cejas-tag danger" : "cejas-tag warn"}>
                          {arquivo.status}
                        </span>
                        <span>{arquivo.evento || "Sem evento"}</span>
                        <span>{arquivo.dataEvento || "Sem data"}</span>
                        <span>{arquivo.mes || "Sem mês"}</span>
                        <span>{arquivo.ano || "Sem ano"}</span>
                        <span>{formatarTamanho(arquivo.tamanho)}</span>
                        <span>.{arquivo.extensao || "sem extensão"}</span>
                        <span>{arquivo.criadoEm}</span>
                        <span>Enviado por {arquivo.enviadoPor}</span>
                      </div>

                      <div className="cejas-path-line">
                        Storage: {arquivo.caminhoStorage}
                      </div>
                    </div>

                    <div className="cejas-file-actions">
                      <button className="cejas-mini-action blue" type="button">Visualizar</button>
                      <button className="cejas-mini-action" type="button">Baixar</button>
                      <button className="cejas-mini-action" type="button" onClick={() => renomearArquivo(arquivo.id)}>Renomear</button>
                      <button className="cejas-mini-action" type="button" onClick={() => moverParaVerificar(arquivo.id)}>Mover</button>
                      <button className="cejas-mini-action red" type="button" onClick={() => excluirArquivo(arquivo.id)}>Excluir</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </section>
    </div>
  );
}
