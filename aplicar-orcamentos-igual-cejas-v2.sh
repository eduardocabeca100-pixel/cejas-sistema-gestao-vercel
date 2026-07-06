#!/usr/bin/env bash
set -euo pipefail

if [ ! -f "package.json" ] || [ ! -d "src/app" ]; then
  echo "ERRO: rode este script dentro da pasta do projeto cejas-sistema-gestao-vercel."
  echo "Dica: cd ~/Downloads/cejas-sistema-gestao-vercel"
  exit 1
fi

mkdir -p "src/app/(system)/orcamentos"

cat > "src/app/(system)/orcamentos/page.tsx" <<'TSX'
"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format/currency";

type CustomerType = "associado" | "nao_associado";
type DayType = "dias_uteis" | "sabado" | "dom_fer";
type RuleType = "fixo" | "tabela";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  details: string;
  value: number;
  rule: RuleType;
};

type BudgetLine = {
  id: string;
  room: string;
  quantity: number;
  details: string;
  unitValue: number;
};

const emptyCatalogForm: Omit<CatalogItem, "id"> = {
  name: "",
  category: "",
  details: "",
  value: 0,
  rule: "fixo",
};

function brDate(value: string) {
  if (!value) return "DATA NÃO INFORMADA";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function brTime(value: string) {
  if (!value) return "--H--";
  return value.replace(":", "H");
}

function moneyToNumber(value: string) {
  const clean = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  return Number(clean || 0);
}

export default function OrcamentosPage() {
  const [issuer, setIssuer] = useState("EDUARDO");
  const [company, setCompany] = useState("");
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("nao_associado");
  const [dayType, setDayType] = useState<DayType>("dias_uteis");
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catalogForm, setCatalogForm] = useState(emptyCatalogForm);

  const total = useMemo(
    () => lines.reduce((sum, item) => sum + item.quantity * item.unitValue, 0),
    [lines],
  );

  const selectedCatalog = catalog.find((item) => item.id === selectedCatalogId);

  function resetCatalogForm() {
    setEditingId(null);
    setCatalogForm(emptyCatalogForm);
  }

  function saveCatalogItem() {
    if (!catalogForm.name.trim()) {
      alert("Informe o nome do item.");
      return;
    }

    if (editingId) {
      setCatalog((current) =>
        current.map((item) =>
          item.id === editingId ? { ...catalogForm, id: editingId, value: Number(catalogForm.value || 0) } : item,
        ),
      );
      resetCatalogForm();
      return;
    }

    setCatalog((current) => [
      ...current,
      { ...catalogForm, id: `item-${Date.now()}`, value: Number(catalogForm.value || 0) },
    ]);
    resetCatalogForm();
  }

  function editCatalogItem(item: CatalogItem) {
    setEditingId(item.id);
    setCatalogForm({
      name: item.name,
      category: item.category,
      details: item.details,
      value: item.value,
      rule: item.rule,
    });
  }

  function useCatalogItem(item: CatalogItem) {
    setLines((current) => [
      ...current,
      {
        id: `line-${Date.now()}`,
        room: item.category || item.name,
        quantity: 1,
        details: item.details || item.name,
        unitValue: item.value,
      },
    ]);
    setSelectedCatalogId(item.id);
    setModalOpen(false);
  }

  function addSelectedItem() {
    if (!selectedCatalog) {
      alert("Selecione um item cadastrado ou crie um item personalizado.");
      return;
    }
    useCatalogItem(selectedCatalog);
  }

  function addCustomItem() {
    setLines((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        room: "",
        quantity: 1,
        details: "",
        unitValue: 0,
      },
    ]);
  }

  function updateLine(id: string, key: keyof BudgetLine, value: string | number) {
    setLines((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  async function saveBudget() {
    const payload = {
      title: eventName ? `Orçamento - ${eventName}` : "Orçamento sem título",
      company,
      eventName,
      issuer,
      customerType,
      dayType,
      notes,
      date,
      startTime,
      endTime,
      items: lines.map((line) => ({
        id: line.id,
        rubric: line.room,
        description: line.room,
        quantity: line.quantity,
        unitValue: line.unitValue,
        details: line.details,
      })),
      total,
      status: "rascunho",
    };

    const response = await fetch("/api/orcamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response?.ok) {
      alert("Não foi possível salvar agora. Confira as variáveis do Supabase e tente novamente.");
      return;
    }

    alert("Orçamento salvo no Supabase.");
  }

  return (
    <div className="orc-v2026-page">
      <header className="orc-v2026-topbar">
        <h1>🏢 CEJAS - Orçamentos v.2026</h1>
        <div className="orc-v2026-top-actions">
          <button type="button" className="orc-pill orc-pill-blue">Conectado 479:57</button>
          <button type="button" className="orc-pill orc-pill-dark">Voltar ao Painel</button>
          <button type="button" className="orc-pill orc-pill-dark" onClick={() => setModalOpen(true)}>⚙ Cadastro de Itens</button>
          <button type="button" className="orc-pill orc-pill-blue" onClick={() => window.print()}>🖨 Imprimir / PDF A4</button>
          <button type="button" className="orc-pill orc-pill-pink" onClick={saveBudget}>Salvar PDF no Servidor</button>
        </div>
      </header>

      <main className="orc-v2026-workspace">
        <section className="orc-v2026-form-card">
          <div className="orc-section">
            <h2>👤 EMISSOR COMERCIAL</h2>
            <label>
              <span>Elaborado por</span>
              <input value={issuer} onChange={(event) => setIssuer(event.target.value.toUpperCase())} />
            </label>
          </div>

          <div className="orc-section">
            <h2>💼 REGRAS DE PREÇO</h2>
            <div className="orc-segment orc-segment-two">
              <button type="button" className={customerType === "associado" ? "is-active-soft" : ""} onClick={() => setCustomerType("associado")}>ASSOCIADO</button>
              <button type="button" className={customerType === "nao_associado" ? "is-active" : ""} onClick={() => setCustomerType("nao_associado")}>NÃO ASSOCIADO</button>
            </div>
            <div className="orc-segment orc-segment-three">
              <button type="button" className={dayType === "dias_uteis" ? "is-active" : ""} onClick={() => setDayType("dias_uteis")}>DIAS ÚTEIS</button>
              <button type="button" className={dayType === "sabado" ? "is-active" : ""} onClick={() => setDayType("sabado")}>SÁBADO</button>
              <button type="button" className={dayType === "dom_fer" ? "is-active" : ""} onClick={() => setDayType("dom_fer")}>DOM/FER</button>
            </div>
            <label>
              <span>Empresa Solicitante</span>
              <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Empresa Solicitante" />
            </label>
            <label>
              <span>Nome do Evento</span>
              <input value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="Nome do Evento" />
            </label>
          </div>

          <div className="orc-section">
            <h2>📄 INFOS ADICIONAIS</h2>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex: Montagem especial, observações do cliente..." />
          </div>

          <div className="orc-section orc-section-last">
            <div className="orc-section-row">
              <h2>📅 CRONOGRAMA</h2>
              <button type="button" className="orc-small-dark">+ Novo Dia</button>
            </div>

            <div className="orc-schedule-card">
              <div className="orc-schedule-row">
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                <button type="button" className="orc-remove-date" onClick={() => { setDate(""); setStartTime(""); setEndTime(""); }}>×</button>
              </div>

              <select value={selectedCatalogId} onChange={(event) => setSelectedCatalogId(event.target.value)}>
                <option value="">+ ADICIONAR ITEM DA TABELA...</option>
                {catalog.map((item) => <option key={item.id} value={item.id}>{item.name} — {formatCurrency(item.value)}</option>)}
              </select>

              <button type="button" className="orc-wide-blue" onClick={addSelectedItem}>✅ ADICIONAR ITEM SELECIONADO AO ORÇAMENTO</button>
              <button type="button" className="orc-wide-outline" onClick={addCustomItem}>⌁ + ITEM PERSONALIZADO / CORINGA</button>
              <button type="button" className="orc-wide-outline" onClick={() => setModalOpen(true)}>⊙ CADASTRAR / EDITAR ITENS DO SISTEMA</button>

              {lines.length > 0 && (
                <div className="orc-edit-lines">
                  {lines.map((line) => (
                    <div className="orc-edit-line" key={line.id}>
                      <input value={line.room} placeholder="Item / Sala" onChange={(event) => updateLine(line.id, "room", event.target.value)} />
                      <input type="number" min="1" value={line.quantity} onChange={(event) => updateLine(line.id, "quantity", Number(event.target.value || 1))} />
                      <input value={line.details} placeholder="Detalhes / Recursos" onChange={(event) => updateLine(line.id, "details", event.target.value)} />
                      <input value={String(line.unitValue).replace(".", ",")} placeholder="Valor" onChange={(event) => updateLine(line.id, "unitValue", moneyToNumber(event.target.value))} />
                      <button type="button" onClick={() => setLines((current) => current.filter((row) => row.id !== line.id))}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="orc-paper-wrap" aria-label="Prévia do orçamento">
          <article className="orc-paper">
            <header className="orc-paper-header">
              <div className="orc-paper-logo">CEJAS</div>
              <div className="orc-paper-company">
                <strong>DOCUMENTO AUXILIAR DE VENDA - ORÇAMENTO</strong>
                <span>De: Centro Empresarial de Jaraguá do Sul - CEJAS</span>
                <span>CNPJ: 83.784.124/0001-32 - IE: Isenta</span>
                <span>Rua Octaviano Lombardi, 100. Czerniewicz | CEP 89255-055</span>
                <span>Jaraguá do Sul - SC</span>
                <span>(47) 3275-7000 – Fax (47) 3275-7001</span>
              </div>
            </header>

            <div className="orc-paper-meta">
              <span><b>Data:</b> {date ? brDate(date) : "__/__/____"}</span>
              <span><b>Elaborado por:</b> {issuer || "__________"}</span>
            </div>

            <div className="orc-paper-title">O R Ç A M E N T O&nbsp;&nbsp; L O C A Ç Ã O&nbsp;&nbsp; D E&nbsp;&nbsp; S A L A S&nbsp;&nbsp; E&nbsp;&nbsp; E Q U I P A M E N T O S</div>

            <div className="orc-paper-client-box">
              <div><b>Solicitante:</b> <span>{company || "________________________"}</span></div>
              <div><b>Evento:</b> <span>{eventName || "________________________"}</span></div>
            </div>

            <h3 className="orc-period-title">
              {date ? `${brDate(date)} - ${brTime(startTime)} AS ${brTime(endTime)}` : "DATA NÃO INFORMADA"}
            </h3>

            <table className="orc-paper-table">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Item / Sala</th>
                  <th>Qtd.</th>
                  <th>Detalhes / Recursos</th>
                  <th>Valor unitário</th>
                  <th>Valor final</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="orc-empty-cell">Nenhum item adicionado.</td>
                  </tr>
                ) : (
                  lines.map((line, index) => (
                    <tr key={line.id}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td><b>{line.room || "ITEM / SALA"}</b></td>
                      <td>{line.quantity}</td>
                      <td>{line.details || "Detalhes / Recursos"}</td>
                      <td>{formatCurrency(line.unitValue)}</td>
                      <td>{formatCurrency(line.quantity * line.unitValue)}</td>
                    </tr>
                  ))
                )}
                <tr>
                  <td colSpan={5} className="orc-subtotal-label">SUBTOTAL DO PERÍODO:</td>
                  <td className="orc-subtotal-value">{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>

            <div className="orc-total-line">
              <span>TOTAL GERAL:</span>
              <b>{formatCurrency(total)}</b>
            </div>

            <footer className="orc-paper-footer">
              <div className="orc-paper-gray-title">OBSERVAÇÕES E CONDIÇÕES</div>
              <p>• Orçamento válido por <b>72 horas</b>. A pré-reserva garante o espaço por este período; após o prazo, o evento é considerado cancelado.</p>
              <p><b>ATENÇÃO: O HORÁRIO LIMITE PARA FECHAMENTO TOTAL DO PRÉDIO É IMPRETERIVELMENTE ÀS 22:00H.</b></p>
              <p><b>FORMAS DE PAGAMENTO:</b></p>
              <p>- Transferência/Depósito: Sicredi Norte (Ag 2602, c/c 04247-2, titular: CEJAS).</p>
              <p>- Boleto Bancário via Sicredi Norte.</p>
              <p>- PIX CNPJ: 83.784.124/0001-32</p>
              <br />
              <p>Permanecemos à disposição.</p>
              <p>Atenciosamente,</p>
              <p><b>{issuer ? issuer.charAt(0).toUpperCase() + issuer.slice(1).toLowerCase() : "Eduardo"}</b><br />Cel: (47) 98835-7184<br />E-mail: comercial@cejas.com.br</p>
              <small>SISTEMA COMERCIAL CEJAS V2026</small>
            </footer>
          </article>
        </section>
      </main>

      {modalOpen && (
        <div className="orc-modal-backdrop" role="dialog" aria-modal="true">
          <section className="orc-modal">
            <header className="orc-modal-header">
              <div>
                <h2>Cadastro de Itens do Orçamento</h2>
                <p>Cadastre, edite e exclua itens da tabela.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)}>Fechar</button>
            </header>

            <div className="orc-modal-body">
              <aside className="orc-modal-form">
                <h3>{editingId ? "Editar item" : "Cadastrar novo item"}</h3>
                <label>
                  <span>Nome</span>
                  <input value={catalogForm.name} onChange={(event) => setCatalogForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Diurno - Sala Básica" />
                </label>
                <label>
                  <span>Categoria</span>
                  <input value={catalogForm.category} onChange={(event) => setCatalogForm((current) => ({ ...current, category: event.target.value }))} placeholder="Ex: Auditório / Equipamentos" />
                </label>
                <label>
                  <span>Detalhes</span>
                  <textarea value={catalogForm.details} onChange={(event) => setCatalogForm((current) => ({ ...current, details: event.target.value }))} placeholder="Descrição que aparece no orçamento" />
                </label>
                <label>
                  <span>Valor</span>
                  <input value={catalogForm.value ? String(catalogForm.value).replace(".", ",") : ""} onChange={(event) => setCatalogForm((current) => ({ ...current, value: moneyToNumber(event.target.value) }))} placeholder="0,00" />
                </label>
                <label>
                  <span>Aplica regra de preço?</span>
                  <select value={catalogForm.rule} onChange={(event) => setCatalogForm((current) => ({ ...current, rule: event.target.value as RuleType }))}>
                    <option value="fixo">Não - valor fixo</option>
                    <option value="tabela">Sim - tabela real</option>
                  </select>
                </label>
                <div className="orc-modal-form-actions">
                  <button type="button" className="orc-modal-save" onClick={saveCatalogItem}>Salvar item</button>
                  <button type="button" className="orc-modal-clear" onClick={resetCatalogForm}>Limpar</button>
                </div>
              </aside>

              <section className="orc-modal-table-card">
                <h3>Itens cadastrados</h3>
                <table className="orc-modal-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Categoria</th>
                      <th>Valor</th>
                      <th>Regra</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="orc-modal-empty">Nenhum item cadastrado ainda. O sistema inicia limpo.</td>
                      </tr>
                    ) : (
                      catalog.map((item) => (
                        <tr key={item.id}>
                          <td><b>{item.name}</b><small>{item.details}</small></td>
                          <td>{item.category || "—"}</td>
                          <td>{formatCurrency(item.value)}</td>
                          <td>{item.rule === "tabela" ? "Tabela real" : "Valor fixo"}</td>
                          <td>
                            <div className="orc-modal-actions">
                              <button type="button" className="use" onClick={() => useCatalogItem(item)}>Usar</button>
                              <button type="button" className="edit" onClick={() => editCatalogItem(item)}>Editar</button>
                              <button type="button" className="delete" onClick={() => setCatalog((current) => current.filter((row) => row.id !== item.id))}>Excluir</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
TSX

cat >> "src/app/globals.css" <<'CSS'

/* CEJAS Orçamentos v.2026 — layout fiel ao sistema antigo */
.orc-v2026-page{margin:-38px -32px -70px;background:#e7e9ee;min-height:calc(100vh + 70px);color:#121827;padding:28px 28px 80px;font-family:Arial,Helvetica,sans-serif}.orc-v2026-page *{box-sizing:border-box}.orc-v2026-topbar{min-height:86px;background:#0d1626;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:22px;padding:0 28px;margin:0 0 44px;box-shadow:0 13px 22px rgba(16,24,40,.18)}.orc-v2026-topbar h1{margin:0;font-size:31px;letter-spacing:-.03em;font-weight:900}.orc-v2026-top-actions{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap}.orc-pill{border:0;border-radius:13px;color:#fff;font-weight:900;min-height:42px;padding:0 20px;box-shadow:inset 0 1px rgba(255,255,255,.12);white-space:nowrap}.orc-pill-blue{background:#2764e7}.orc-pill-dark{background:#293241}.orc-pill-pink{background:#d948b8}.orc-v2026-workspace{display:grid;grid-template-columns:minmax(420px,590px) minmax(720px,1fr);gap:72px;align-items:start;max-width:1800px;margin:0 auto}.orc-v2026-form-card{background:#fff;border-radius:19px;padding:26px 28px 28px;box-shadow:0 18px 48px rgba(20,27,45,.12);align-self:start}.orc-section{border-bottom:1px solid #e3e7ee;padding-bottom:21px;margin-bottom:24px}.orc-section-last{border-bottom:0;margin-bottom:0;padding-bottom:0}.orc-section h2{font-size:16px;margin:0 0 18px;letter-spacing:.28em;color:#1b2538;font-weight:900}.orc-section label,.orc-modal-form label{display:block;margin:12px 0}.orc-section label span,.orc-modal-form label span{display:block;font-size:13px;font-weight:900;color:#263044;margin-bottom:8px}.orc-section input,.orc-section select,.orc-section textarea,.orc-modal input,.orc-modal select,.orc-modal textarea{width:100%;border:1px solid #d8dde7;background:#f8f9fb;color:#222a39;border-radius:12px;min-height:43px;padding:0 14px;outline:none;font:inherit}.orc-section textarea,.orc-modal textarea{min-height:112px;padding-top:13px;resize:vertical}.orc-section input:focus,.orc-section select:focus,.orc-section textarea:focus,.orc-modal input:focus,.orc-modal select:focus,.orc-modal textarea:focus{border-color:#2b6cf0;box-shadow:0 0 0 3px rgba(43,108,240,.12)}.orc-segment{display:grid;border:1px solid #d8dde7;border-radius:12px;overflow:hidden;margin:12px 0;background:#fff}.orc-segment-two{grid-template-columns:1fr 1fr}.orc-segment-three{grid-template-columns:1fr 1fr 1fr}.orc-segment button{height:45px;border:0;border-right:1px solid #d8dde7;background:#fff;color:#9aa1ae;font-size:13px;font-weight:900}.orc-segment button:last-child{border-right:0}.orc-segment button.is-active{background:#111c2f;color:#fff}.orc-segment button.is-active-soft{background:#eef1f6;color:#111c2f}.orc-section-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.orc-section-row h2{margin:0}.orc-small-dark{border:0;border-radius:12px;background:#111c2f;color:#fff;font-weight:900;min-height:40px;padding:0 16px}.orc-schedule-card{margin-top:18px;border:1px solid #e3e7ee;background:#fbfcfe;border-radius:22px;padding:18px;box-shadow:inset 0 0 0 6px rgba(238,242,247,.55)}.orc-schedule-row{display:grid;grid-template-columns:1fr 1fr 1fr 24px;gap:10px;align-items:center;margin-bottom:14px}.orc-remove-date{border:0;background:transparent;color:#ef233c;font-size:20px;font-weight:900}.orc-wide-blue,.orc-wide-outline{width:100%;min-height:43px;border-radius:12px;font-size:13px;font-weight:900;margin-top:12px}.orc-wide-blue{border:0;background:#eaf2ff;color:#0c48d3}.orc-wide-outline{border:1px dashed #d9dfe9;background:#fff;color:#58708e}.orc-edit-lines{margin-top:18px;display:grid;gap:10px}.orc-edit-line{display:grid;grid-template-columns:1.2fr 64px 1.3fr 95px 32px;gap:8px;align-items:center}.orc-edit-line button{height:36px;border:0;background:#ef233c;color:#fff;border-radius:9px;font-weight:900}.orc-paper-wrap{display:flex;justify-content:center;align-items:flex-start}.orc-paper{width:820px;min-height:1160px;background:#fff;box-shadow:0 24px 55px rgba(20,27,45,.15);padding:42px 42px 32px;color:#142033;font-family:Arial,Helvetica,sans-serif}.orc-paper-header{display:grid;grid-template-columns:82px 1fr;gap:20px;align-items:start;border-bottom:2px solid #1e2837;padding-bottom:28px}.orc-paper-logo{width:72px;height:72px;background:#777;display:grid;place-items:center;color:#fff;font-weight:900;font-size:23px;letter-spacing:-1px}.orc-paper-company{text-align:right;font-size:12px;line-height:1.35;color:#162035}.orc-paper-company strong{display:block;font-size:12px;margin-bottom:3px}.orc-paper-company span{display:block}.orc-paper-meta{display:flex;justify-content:space-between;align-items:center;font-size:12px;margin:20px 0 14px}.orc-paper-title{background:#f0f2f5;border:1px solid #d9dde4;text-align:center;padding:12px 8px;font-size:11px;letter-spacing:.33em;font-weight:900;margin-bottom:22px}.orc-paper-client-box{border:1px solid #d9dde4;padding:19px 18px;font-size:12px;line-height:2}.orc-paper-client-box b{display:inline-block;width:92px}.orc-period-title{font-size:15px;margin:22px 0 8px;font-weight:900;color:#192334;border-left:4px solid #8ea3c0;padding-left:10px;text-transform:uppercase}.orc-paper-table{width:100%;border-collapse:collapse;font-size:11px}.orc-paper-table th,.orc-paper-table td{border:1px solid #d9dde4;padding:9px 10px;text-align:left;vertical-align:top}.orc-paper-table th{background:#eef0f3;font-size:9px;font-weight:900;color:#142033}.orc-paper-table th:nth-child(1),.orc-paper-table td:nth-child(1){width:44px;text-align:center}.orc-paper-table th:nth-child(3),.orc-paper-table td:nth-child(3){width:52px;text-align:center}.orc-paper-table th:nth-child(5),.orc-paper-table td:nth-child(5),.orc-paper-table th:nth-child(6),.orc-paper-table td:nth-child(6){text-align:right;width:118px}.orc-empty-cell{text-align:center!important;color:#8892a3;height:48px}.orc-subtotal-label{text-align:right!important;font-weight:900;background:#f5f6f8}.orc-subtotal-value{text-align:right!important;font-weight:900;background:#f5f6f8}.orc-total-line{display:flex;align-items:center;justify-content:flex-end;gap:34px;margin-top:17px;font-size:16px;font-weight:900}.orc-total-line b{font-size:21px}.orc-paper-footer{margin-top:250px;font-size:11px;line-height:1.55;position:relative}.orc-paper-footer p{margin:4px 0}.orc-paper-gray-title{background:#dde1e7;padding:10px 12px;letter-spacing:.24em;font-size:10px;font-weight:900;margin-bottom:10px}.orc-paper-footer small{position:absolute;right:0;bottom:0;color:#8ea1bc;font-size:10px}.orc-modal-backdrop{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.72);backdrop-filter:blur(9px);display:flex;align-items:flex-start;justify-content:center;padding:58px 24px 80px;overflow:auto}.orc-modal{width:min(1300px,92vw);background:#fff;color:#111827;border-radius:18px;overflow:hidden;box-shadow:0 38px 90px rgba(0,0,0,.45)}.orc-modal-header{min-height:108px;background:#0d1626;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 34px}.orc-modal-header h2{margin:0;font-size:31px;letter-spacing:-.02em}.orc-modal-header p{margin:6px 0 0;color:#d1d7e4;font-weight:700}.orc-modal-header button{border:0;border-radius:10px;background:#313a49;color:#fff;font-weight:900;min-height:42px;padding:0 18px}.orc-modal-body{display:grid;grid-template-columns:430px 1fr;gap:24px;padding:28px}.orc-modal-form,.orc-modal-table-card{border:1px solid #dce1ea;background:#f9fafc;border-radius:15px;padding:20px}.orc-modal-form h3,.orc-modal-table-card h3{margin:0 0 18px;font-size:18px;color:#202b3f}.orc-modal-form textarea{min-height:104px}.orc-modal-form-actions{display:flex;gap:8px;margin-top:14px}.orc-modal-save,.orc-modal-clear{border:0;border-radius:10px;min-height:38px;padding:0 14px;color:#fff;font-weight:900}.orc-modal-save{background:#2264ea}.orc-modal-clear{background:#111827}.orc-modal-table{width:100%;border-collapse:collapse;background:#fff;font-size:13px}.orc-modal-table th,.orc-modal-table td{border:1px solid #dce1ea;padding:14px;vertical-align:middle;text-align:left}.orc-modal-table th{background:#eef0f3;color:#111827;font-size:11px;font-weight:900}.orc-modal-table td small{display:block;color:#475569;margin-top:5px}.orc-modal-empty{text-align:center!important;color:#7b8494;height:130px}.orc-modal-actions{display:grid;gap:7px;width:76px}.orc-modal-actions button{border:0;border-radius:9px;color:#fff;font-weight:900;min-height:35px}.orc-modal-actions .use{background:#2563eb}.orc-modal-actions .edit{background:#111827}.orc-modal-actions .delete{background:#ef233c}@media(max-width:1500px){.orc-v2026-workspace{grid-template-columns:minmax(390px,530px) minmax(660px,1fr);gap:46px}.orc-paper{width:760px}}@media(max-width:1220px){.orc-v2026-workspace{grid-template-columns:1fr}.orc-paper{width:min(820px,100%)}.orc-modal-body{grid-template-columns:1fr}}@media(max-width:760px){.orc-v2026-page{margin:-24px -16px -70px;padding:18px}.orc-v2026-topbar{height:auto;align-items:flex-start;flex-direction:column;padding:22px}.orc-v2026-topbar h1{font-size:24px}.orc-paper{padding:25px 18px;width:100%;min-height:auto}.orc-paper-header{grid-template-columns:1fr}.orc-paper-company{text-align:left}.orc-schedule-row,.orc-edit-line{grid-template-columns:1fr}.orc-modal-backdrop{padding:20px}.orc-modal-header{align-items:flex-start;flex-direction:column;padding:24px;gap:18px}.orc-modal-body{padding:18px}.orc-modal-table{font-size:12px}}@media print{body{background:#fff!important}.sidebar,.orc-v2026-topbar,.orc-v2026-form-card,.orc-modal-backdrop{display:none!important}.app-frame{display:block!important}.app-main{padding:0!important}.orc-v2026-page{margin:0!important;padding:0!important;background:#fff!important}.orc-v2026-workspace{display:block!important}.orc-paper-wrap{display:block!important}.orc-paper{box-shadow:none!important;width:100%!important;min-height:auto!important;padding:30px!important}.orc-paper-footer{margin-top:180px}}
CSS

echo "OK: Orçamentos v.2026 substituído pelo layout fiel ao sistema antigo."
echo "Agora rode: npm run typecheck && npm run build && npm run dev"
