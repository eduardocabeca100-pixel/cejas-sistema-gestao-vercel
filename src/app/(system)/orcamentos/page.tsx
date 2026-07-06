"use client";

import { useMemo, useState } from "react";
import {
  CEJAS_ORCAMENTO_CATALOGO,
  formatarMoeda,
  getValorCatalogo,
  type CatalogoOrcamentoItem,
  type TipoClienteOrcamento,
  type TipoDiaOrcamento
} from "@/lib/orcamentos/catalogo-cejas";

type ItemEditavel = CatalogoOrcamentoItem & {
  id: string;
  ativo: boolean;
};

type ItemOrcamento = {
  id: string;
  data: string;
  inicio: string;
  fim: string;
  categoria: string;
  item: string;
  detalhes: string;
  quantidade: number;
  valorUnitario: number;
  valorFinal: number;
};

type FormCatalogo = ItemEditavel;

const css = `
.cejas-orcamento-page {
  width: 100%;
  min-height: 100vh;
  background: #e5e7eb;
  color: #1f2937;
}

.cejas-orcamento-topbar {
  height: 72px;
  background: #0f172a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  box-shadow: 0 4px 18px rgba(0,0,0,.16);
}

.cejas-orcamento-topbar h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.cejas-top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.cejas-session-pill {
  background: rgba(59,130,246,.16);
  color: #dbeafe;
  border: 1px solid rgba(147,197,253,.2);
  border-radius: 999px;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 800;
}

.cejas-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  background: #1f2937;
  transition: .2s;
  white-space: nowrap;
}

.cejas-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.cejas-btn.blue {
  background: #2563eb;
}

.cejas-btn.magenta {
  background: linear-gradient(135deg, #7B61FF, #FF61D2);
}

.cejas-orcamento-workspace {
  height: calc(100vh - 72px);
  overflow: hidden;
  display: grid;
  grid-template-columns: 420px minmax(760px, 1fr);
  gap: 28px;
  padding: 18px;
  align-items: start;
}

.cejas-editor {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 18px 40px rgba(15,23,42,.14);
}

.cejas-editor-section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 18px;
  margin-bottom: 20px;
}

.cejas-editor-section:last-child {
  border-bottom: 0;
  margin-bottom: 0;
}

.cejas-editor h2 {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: #1e293b;
}

.cejas-field {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
  min-width: 0;
}

.cejas-field label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #334155;
}

.cejas-field input,
.cejas-field select,
.cejas-field textarea,
.cejas-modal input,
.cejas-modal select,
.cejas-modal textarea,
.cejas-day-top input,
.cejas-item-grid select {
  width: 100% !important;
  min-width: 0 !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 12px !important;
  background: #f8fafc !important;
  color: #1f2937 !important;
  padding: 12px 14px !important;
  outline: none !important;
  font-size: 11px !important;
  box-shadow: none !important;
  appearance: none;
}

.cejas-field input:focus,
.cejas-field select:focus,
.cejas-field textarea:focus,
.cejas-day-top input:focus,
.cejas-item-grid select:focus {
  border-color: #93c5fd !important;
  box-shadow: 0 0 0 4px rgba(59,130,246,.12) !important;
}

.cejas-field textarea {
  min-height: 92px !important;
  resize: vertical;
}

.cejas-toggle {
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  background: #ffffff;
}

.cejas-toggle button {
  flex: 1;
  border: 0;
  background: #ffffff;
  color: #9ca3af;
  padding: 10px 8px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.cejas-toggle button.active {
  background: #1e293b;
  color: #ffffff;
}

.cejas-toggle button.green.active {
  background: #059669;
}

.cejas-cron-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.cejas-pill-btn {
  border: 0;
  border-radius: 999px;
  background: #1e293b;
  color: #fff;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.cejas-day-card {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 14px;
  background: #f8fafc;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.75);
}

.cejas-day-top {
  display: grid;
  grid-template-columns: minmax(0,1fr) 124px 124px;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.cejas-day-top input {
  height: 46px !important;
}

.cejas-item-grid {
  display: grid;
  gap: 10px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.cejas-item-grid > select {
  height: 46px !important;
  background: #ffffff !important;
}

.cejas-inline-grid {
  display: grid;
  grid-template-columns: 90px minmax(0,1fr) minmax(0,1fr);
  gap: 10px;
  align-items: end;
}

.cejas-inline-grid > .cejas-field {
  margin-bottom: 0;
}

.cejas-inline-grid input {
  height: 46px !important;
}

.cejas-small-info {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  margin: 2px 0 0;
}

.cejas-custom-btn {
  width: 100%;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  color: #64748b;
  padding: 14px 12px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.cejas-custom-btn.primary {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.cejas-custom-btn.success {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.cejas-preview {
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0 0 40px;
}

.cejas-document-stack {
  display: grid;
  gap: 24px;
  justify-items: center;
  width: 100%;
}

.cejas-document {
  width: 21cm;
  min-height: 29.7cm;
  background: #ffffff;
  color: #1f2937;
  padding: 28px;
  box-shadow: 0 20px 45px rgba(15,23,42,.18);
  transform: scale(.84);
  transform-origin: top center;
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

.cejas-doc-header {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 26px;
  align-items: start;
  padding-bottom: 18px;
  margin-bottom: 14px;
  border-bottom: 2px solid #111827;
}

.cejas-logo-box {
  width: 72px;
  height: 72px;
  background: #777;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 900;
}

.cejas-doc-company {
  text-align: right;
  color: #374151;
  font-size: 10px;
  line-height: 1.3;
}

.cejas-doc-company strong {
  color: #111827;
  display: block;
  font-size: 11px;
  margin-bottom: 4px;
  font-weight: 900;
  text-transform: uppercase;
}

.cejas-doc-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 10px;
}

.cejas-doc-title {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  text-align: center;
  text-transform: uppercase;
  font-weight: 900;
  font-size: 10px;
  letter-spacing: .3em;
  padding: 9px 10px;
  margin-bottom: 14px;
}

.cejas-doc-fields {
  border: 1px solid #d1d5db;
  padding: 12px;
  margin-bottom: 15px;
  line-height: 1.75;
  font-size: 12px;
}

.cejas-doc-fields strong {
  display: inline-block;
  width: 108px;
}

.cejas-period-title {
  border-left: 4px solid #94a3b8;
  padding-left: 10px;
  font-size: 14px;
  margin-bottom: 8px;
  text-transform: uppercase;
  color: #1f2937;
  font-weight: 900;
}

.cejas-doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  margin-bottom: 10px;
}

.cejas-doc-table th,
.cejas-doc-table td {
  border: 1px solid #d1d5db;
  padding: 6px;
  text-align: left;
  vertical-align: top;
}

.cejas-doc-table th {
  background: #f3f4f6;
  font-weight: 900;
}

.cejas-num {
  text-align: right !important;
  white-space: nowrap;
}

.cejas-subtotal td {
  background: #f8fafc;
  font-weight: 900;
  text-transform: uppercase;
}

.cejas-total-box {
  display: grid;
  justify-content: end;
  gap: 4px;
  margin: 8px 0 14px;
  font-size: 14px;
  font-weight: 900;
}

.cejas-total-box div {
  display: flex;
  gap: 24px;
  justify-content: space-between;
}

.cejas-total-final {
  font-size: 18px;
}

.cejas-conditions {
  margin-top: 10px;
  border: 1px solid #d1d5db;
  background: #f8fafc;
  margin-bottom: 18px;
}

.cejas-conditions h3 {
  background: #e5e7eb;
  padding: 8px 12px;
  font-size: 10px;
  letter-spacing: .16em;
  text-transform: uppercase;
  margin: 0;
}

.cejas-conditions div {
  padding: 12px;
  font-size: 11px;
  line-height: 1.55;
}

.cejas-warning {
  font-weight: 900;
  color: #111827;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 7px 0;
  margin: 7px 0;
  text-transform: uppercase;
}

.cejas-signature {
  display: flex;
  justify-content: space-between;
  align-items: end;
  font-size: 12px;
}

.cejas-signature strong {
  display: block;
  font-size: 14px;
  color: #111827;
  margin-top: 10px;
}

.cejas-system-mark {
  font-size: 9px;
  color: #94a3b8;
  text-transform: uppercase;
}

.cejas-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(8px);
  padding: 30px;
  overflow-y: auto;
}

.cejas-modal {
  max-width: 1180px;
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,.4);
}

.cejas-modal-header {
  background: #0f172a;
  color: #fff;
  padding: 22px 26px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cejas-modal-header h2 {
  margin: 0;
  font-size: 24px;
}

.cejas-modal-body {
  padding: 22px;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 22px;
}

.cejas-modal-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #f8fafc;
}

.cejas-catalog-table-wrap {
  max-height: 70vh;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
}

.cejas-catalog-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.cejas-catalog-table th,
.cejas-catalog-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

.cejas-catalog-table th {
  position: sticky;
  top: 0;
  background: #f1f5f9;
  z-index: 2;
  font-weight: 900;
}

.cejas-action-column {
  display: grid;
  gap: 5px;
}

.cejas-mini-btn {
  border: 0;
  border-radius: 8px;
  padding: 7px 9px;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.cejas-mini-btn.use {
  background: #2563eb;
}

.cejas-mini-btn.edit {
  background: #111827;
}

.cejas-mini-btn.delete {
  background: #ef4444;
}

.cejas-values-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

@media (max-width: 1260px) {
  .cejas-orcamento-workspace {
    grid-template-columns: 390px minmax(0,1fr);
  }

  .cejas-document {
    transform: scale(.82);
  }
}

@media (max-width: 1100px) {
  .cejas-orcamento-workspace {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }

  .cejas-orcamento-page {
    overflow: auto;
  }

  .cejas-editor,
  .cejas-preview {
    height: auto;
    overflow: visible;
  }

  .cejas-document {
    transform: scale(.70);
  }

  .cejas-modal-body {
    grid-template-columns: 1fr;
  }
}
`;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function criarCatalogoInicial(): ItemEditavel[] {
  return CEJAS_ORCAMENTO_CATALOGO.map((item) => ({
    ...item,
    id: `${slugify(item.categoria)}-${slugify(item.item)}`,
    ativo: true
  }));
}

function criarFormVazio(): FormCatalogo {
  return {
    id: "",
    categoria: "",
    item: "",
    associado: { diasUteis: 0, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 0, sabado: 0, domingoFeriado: 0 },
    ativo: true
  };
}

function hojeBR(): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

function dataBR(data: string): string {
  if (!data) return "DATA NÃO INFORMADA";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function dividirItensEmPaginas(itens: ItemOrcamento[]): ItemOrcamento[][] {
  if (itens.length <= 8) return [itens];

  const paginas: ItemOrcamento[][] = [];
  let cursor = 0;

  paginas.push(itens.slice(cursor, cursor + 10));
  cursor += 10;

  while (cursor < itens.length) {
    paginas.push(itens.slice(cursor, cursor + 14));
    cursor += 14;
  }

  return paginas;
}

export default function OrcamentosPage() {
  const [catalogo, setCatalogo] = useState<ItemEditavel[]>(criarCatalogoInicial);
  const [tipoCliente, setTipoCliente] = useState<TipoClienteOrcamento>("naoAssociado");
  const [tipoDia, setTipoDia] = useState<TipoDiaOrcamento>("diasUteis");
  const [emissor, setEmissor] = useState("EDUARDO");
  const [solicitante, setSolicitante] = useState("");
  const [evento, setEvento] = useState("");
  const [infos, setInfos] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");
  const [status, setStatus] = useState("rascunho");
  const [desconto, setDesconto] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);
  const [formCatalogo, setFormCatalogo] = useState<FormCatalogo>(criarFormVazio);
  const [linha, setLinha] = useState({
    data: "",
    inicio: "",
    fim: "",
    categoria: "",
    itemId: "",
    quantidade: 1
  });
  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  const categorias = useMemo(() => {
    return Array.from(new Set(catalogo.filter((item) => item.ativo).map((item) => item.categoria)));
  }, [catalogo]);

  const itensFiltrados = useMemo(() => {
    return catalogo.filter((item) => item.ativo && (!linha.categoria || item.categoria === linha.categoria));
  }, [catalogo, linha.categoria]);

  const itemSelecionado = useMemo(() => {
    return catalogo.find((item) => item.id === linha.itemId);
  }, [catalogo, linha.itemId]);

  const valorUnitario = itemSelecionado ? getValorCatalogo(itemSelecionado, tipoCliente, tipoDia) : 0;
  const subtotalLinha = valorUnitario * Number(linha.quantidade || 0);
  const totalBruto = itens.reduce((acc, item) => acc + item.valorFinal, 0);
  const totalFinal = Math.max(totalBruto - Number(desconto || 0), 0);
  const paginas = dividirItensEmPaginas(itens);

  function restaurarCatalogo() {
    setCatalogo(criarCatalogoInicial());
    setFormCatalogo(criarFormVazio());
  }

  function adicionarItemSelecionado() {
    if (!itemSelecionado) return;

    const quantidade = Math.max(Number(linha.quantidade || 1), 1);

    setItens((atual) => [
      ...atual,
      {
        id: `${Date.now()}-${Math.random()}`,
        data: linha.data,
        inicio: linha.inicio,
        fim: linha.fim,
        categoria: itemSelecionado.categoria,
        item: itemSelecionado.item,
        detalhes: itemSelecionado.item,
        quantidade,
        valorUnitario,
        valorFinal: quantidade * valorUnitario
      }
    ]);
  }

  function adicionarItemPersonalizado() {
    const nome = window.prompt("Digite o nome do item personalizado:");
    if (!nome) return;

    const valorTexto = window.prompt("Digite o valor unitário em reais:", "0");
    const valor = Number((valorTexto || "0").replace(",", "."));
    const quantidade = Math.max(Number(linha.quantidade || 1), 1);

    setItens((atual) => [
      ...atual,
      {
        id: `${Date.now()}-${Math.random()}`,
        data: linha.data,
        inicio: linha.inicio,
        fim: linha.fim,
        categoria: "Item personalizado",
        item: nome,
        detalhes: nome,
        quantidade,
        valorUnitario: valor,
        valorFinal: quantidade * valor
      }
    ]);
  }

  function removerItemOrcamento(id: string) {
    setItens((atual) => atual.filter((item) => item.id !== id));
  }

  function usarItemDoCatalogo(item: ItemEditavel) {
    setLinha((atual) => ({
      ...atual,
      categoria: item.categoria,
      itemId: item.id
    }));
    setModalAberto(false);
  }

  function editarItemCatalogo(item: ItemEditavel) {
    setFormCatalogo(item);
  }

  function excluirItemCatalogo(id: string) {
    setCatalogo((atual) => atual.map((item) => item.id === id ? { ...item, ativo: false } : item));
  }

  function salvarItemCatalogo() {
    if (!formCatalogo.categoria.trim() || !formCatalogo.item.trim()) {
      alert("Preencha categoria e item.");
      return;
    }

    const id = formCatalogo.id || `${slugify(formCatalogo.categoria)}-${slugify(formCatalogo.item)}-${Date.now()}`;

    setCatalogo((atual) => {
      const existe = atual.some((item) => item.id === id);
      const itemFinal = { ...formCatalogo, id, ativo: true };

      if (existe) {
        return atual.map((item) => item.id === id ? itemFinal : item);
      }

      return [itemFinal, ...atual];
    });

    setFormCatalogo(criarFormVazio());
  }

  function salvarRascunhoLocal() {
    const payload = {
      emissor,
      solicitante,
      evento,
      infos,
      observacoesCliente,
      status,
      tipoCliente,
      tipoDia,
      desconto,
      itens
    };

    console.log("Rascunho local do orçamento:", payload);
    alert("Rascunho local preparado. Depois vamos salvar oficialmente no Supabase.");
  }




  function abrirJanelaImpressao() {
    const area = document.getElementById("cejas-print-area");

    if (!area) {
      alert("Área de impressão não encontrada.");
      return;
    }

    const antigo = document.getElementById("cejas-print-frame");
    antigo?.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "cejas-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    document.body.appendChild(iframe);

    const janela = iframe.contentWindow;
    const documento = iframe.contentDocument || janela?.document;

    if (!janela || !documento) {
      alert("Não foi possível preparar a impressão.");
      iframe.remove();
      return;
    }

    documento.open();
    documento.write(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Orçamento CEJAS</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cejas-document-stack {
    display: block !important;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .cejas-document {
    width: 190mm !important;
    min-height: auto !important;
    height: auto !important;
    margin: 0 auto !important;
    padding: 5mm !important;
    background: #ffffff !important;
    color: #1f2937 !important;
    box-shadow: none !important;
    transform: none !important;
    display: flex !important;
    flex-direction: column !important;
    font-size: 8.2px !important;
    overflow: visible !important;
    page-break-after: always;
    break-after: page;
  }

  .cejas-document:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .cejas-doc-header {
    display: grid !important;
    grid-template-columns: 26mm 1fr !important;
    gap: 8mm !important;
    align-items: start !important;
    padding-bottom: 5mm !important;
    margin-bottom: 4mm !important;
    border-bottom: 1.5px solid #111827 !important;
  }

  .cejas-logo-box {
    width: 22mm !important;
    height: 22mm !important;
    background: #777777 !important;
    color: #ffffff !important;
    display: grid !important;
    place-items: center !important;
    font-size: 12px !important;
    font-weight: 900 !important;
  }

  .cejas-doc-company {
    text-align: right !important;
    color: #374151 !important;
    font-size: 7.6px !important;
    line-height: 1.24 !important;
  }

  .cejas-doc-company strong {
    display: block !important;
    color: #111827 !important;
    font-size: 8.4px !important;
    line-height: 1.12 !important;
    margin-bottom: 2px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
  }

  .cejas-doc-meta {
    display: flex !important;
    justify-content: space-between !important;
    margin-bottom: 3mm !important;
    font-size: 7.8px !important;
  }

  .cejas-doc-title {
    background: #f3f4f6 !important;
    border: 1px solid #d1d5db !important;
    text-align: center !important;
    text-transform: uppercase !important;
    font-weight: 900 !important;
    font-size: 7.8px !important;
    letter-spacing: .28em !important;
    padding: 2.2mm !important;
    margin-bottom: 3.5mm !important;
  }

  .cejas-doc-fields {
    border: 1px solid #d1d5db !important;
    padding: 3mm !important;
    margin-bottom: 3.5mm !important;
    line-height: 1.48 !important;
    font-size: 8px !important;
  }

  .cejas-doc-fields strong {
    display: inline-block !important;
    width: 25mm !important;
  }

  .cejas-period-title {
    border-left: 3px solid #94a3b8 !important;
    padding-left: 2.5mm !important;
    font-size: 8.8px !important;
    margin-bottom: 2mm !important;
    text-transform: uppercase !important;
    color: #1f2937 !important;
    font-weight: 900 !important;
  }

  .cejas-doc-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 7.4px !important;
    margin-bottom: 3mm !important;
    table-layout: fixed !important;
  }

  .cejas-doc-table th,
  .cejas-doc-table td {
    border: 1px solid #d1d5db !important;
    padding: 1.45mm !important;
    text-align: left !important;
    vertical-align: top !important;
    overflow-wrap: anywhere !important;
  }

  .cejas-doc-table th {
    background: #f3f4f6 !important;
    font-weight: 900 !important;
  }

  .cejas-num {
    text-align: right !important;
    white-space: nowrap !important;
  }

  .cejas-subtotal td {
    background: #f8fafc !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
  }

  .cejas-total-box {
    display: grid !important;
    justify-content: end !important;
    gap: 2px !important;
    margin: 2mm 0 3mm !important;
    font-size: 9px !important;
    font-weight: 900 !important;
  }

  .cejas-total-box div {
    display: flex !important;
    gap: 14mm !important;
    justify-content: space-between !important;
  }

  .cejas-total-final {
    font-size: 11px !important;
  }

  .cejas-conditions {
    margin-top: 3mm !important;
    border: 1px solid #d1d5db !important;
    background: #f8fafc !important;
    margin-bottom: 3mm !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .cejas-conditions h3 {
    background: #e5e7eb !important;
    padding: 1.8mm 3mm !important;
    font-size: 7.2px !important;
    letter-spacing: .14em !important;
    text-transform: uppercase !important;
    margin: 0 !important;
  }

  .cejas-conditions div {
    padding: 2.5mm !important;
    font-size: 7.4px !important;
    line-height: 1.36 !important;
  }

  .cejas-warning {
    font-weight: 900 !important;
    color: #111827 !important;
    border-top: 1px solid #e5e7eb !important;
    border-bottom: 1px solid #e5e7eb !important;
    padding: 1.2mm 0 !important;
    margin: 1.2mm 0 !important;
    text-transform: uppercase !important;
  }

  .cejas-signature {
    display: flex !important;
    justify-content: space-between !important;
    align-items: end !important;
    font-size: 7.8px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .cejas-signature strong {
    display: block !important;
    font-size: 8.8px !important;
    color: #111827 !important;
    margin-top: 1.5mm !important;
  }

  .cejas-system-mark {
    font-size: 6.6px !important;
    color: #94a3b8 !important;
    text-transform: uppercase !important;
  }

  table,
  tr,
  td,
  th {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
</style>
</head>
<body>
${area.innerHTML}
</body>
</html>`);
    documento.close();

    setTimeout(() => {
      janela.focus();
      janela.print();

      setTimeout(() => {
        iframe.remove();
      }, 1500);
    }, 300);
  }


  return (
    <div className="cejas-orcamento-page">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header className="cejas-orcamento-topbar">
        <h1>🏢 CEJAS - Orçamentos v.2026</h1>

        <div className="cejas-top-actions">
          <span className="cejas-session-pill">CSS OK • Catálogo oficial: {catalogo.filter((item) => item.ativo).length} itens</span>
          <button className="cejas-btn" type="button" onClick={restaurarCatalogo}>Restaurar catálogo oficial</button>
          <button className="cejas-btn" type="button" onClick={() => setModalAberto(true)}>⚙ Cadastro de Itens</button>
          <button className="cejas-btn blue" type="button" onClick={abrirJanelaImpressao}>🖨 Imprimir / PDF A4</button>
          <button className="cejas-btn magenta" type="button" onClick={salvarRascunhoLocal}>Salvar rascunho local</button>
        </div>
      </header>

      <section className="cejas-orcamento-workspace">
        <aside className="cejas-editor">
          <section className="cejas-editor-section">
            <h2>👤 Emissor Comercial</h2>
            <div className="cejas-field">
              <label>Elaborado por</label>
              <input value={emissor} onChange={(event) => setEmissor(event.target.value)} />
            </div>
          </section>

          <section className="cejas-editor-section">
            <h2>💼 Regras de Preço</h2>

            <div className="cejas-toggle">
              <button type="button" className={tipoCliente === "associado" ? "active green" : ""} onClick={() => setTipoCliente("associado")}>ASSOCIADO</button>
              <button type="button" className={tipoCliente === "naoAssociado" ? "active" : ""} onClick={() => setTipoCliente("naoAssociado")}>NÃO ASSOCIADO</button>
            </div>

            <div className="cejas-toggle">
              <button type="button" className={tipoDia === "diasUteis" ? "active" : ""} onClick={() => setTipoDia("diasUteis")}>DIAS ÚTEIS</button>
              <button type="button" className={tipoDia === "sabado" ? "active" : ""} onClick={() => setTipoDia("sabado")}>SÁBADO</button>
              <button type="button" className={tipoDia === "domingoFeriado" ? "active" : ""} onClick={() => setTipoDia("domingoFeriado")}>DOM/FER</button>
            </div>

            <div className="cejas-field">
              <label>Empresa Solicitante</label>
              <input placeholder="Empresa Solicitante" value={solicitante} onChange={(event) => setSolicitante(event.target.value)} />
            </div>

            <div className="cejas-field">
              <label>Nome do Evento</label>
              <input placeholder="Nome do Evento" value={evento} onChange={(event) => setEvento(event.target.value)} />
            </div>

            <div className="cejas-field">
              <label>Status do orçamento</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="rascunho">Rascunho</option>
                <option value="enviado">Enviado</option>
                <option value="aprovado">Aprovado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </section>

          <section className="cejas-editor-section">
            <h2>📄 Infos Adicionais</h2>
            <div className="cejas-field">
              <textarea placeholder="Ex: Montagem especial, observações internas..." value={infos} onChange={(event) => setInfos(event.target.value)} />
            </div>
            <div className="cejas-field">
              <label>Observações para o cliente</label>
              <textarea placeholder="Observações que devem aparecer no orçamento..." value={observacoesCliente} onChange={(event) => setObservacoesCliente(event.target.value)} />
            </div>
          </section>

          <section className="cejas-editor-section">
            <div className="cejas-cron-title">
              <h2 style={{ margin: 0 }}>📅 Cronograma</h2>
              <button className="cejas-pill-btn" type="button">+ Novo Dia</button>
            </div>

            <div className="cejas-day-card">
              <div className="cejas-day-top">
                <input type="date" value={linha.data} onChange={(event) => setLinha({ ...linha, data: event.target.value })} />
                <input type="time" value={linha.inicio} onChange={(event) => setLinha({ ...linha, inicio: event.target.value })} />
                <input type="time" value={linha.fim} onChange={(event) => setLinha({ ...linha, fim: event.target.value })} />
              </div>

              <div className="cejas-item-grid">
                <select
                  value={linha.categoria}
                  onChange={(event) => setLinha({ ...linha, categoria: event.target.value, itemId: "" })}
                >
                  <option value="">Todas as categorias / todos os espaços</option>
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>

                <select
                  value={linha.itemId}
                  onChange={(event) => setLinha({ ...linha, itemId: event.target.value })}
                >
                  <option value="">+ ADICIONAR ITEM DA TABELA...</option>
                  {itensFiltrados.map((item) => {
                    const valor = getValorCatalogo(item, tipoCliente, tipoDia);
                    return (
                      <option key={item.id} value={item.id}>
                        {item.categoria} — {item.item} — {formatarMoeda(valor)}
                      </option>
                    );
                  })}
                </select>

                <div className="cejas-inline-grid">
                  <div className="cejas-field">
                    <label>Qtd.</label>
                    <input type="number" min={1} value={linha.quantidade} onChange={(event) => setLinha({ ...linha, quantidade: Number(event.target.value) })} />
                  </div>
                  <div className="cejas-field">
                    <label>Valor unit.</label>
                    <input value={formatarMoeda(valorUnitario)} readOnly />
                  </div>
                  <div className="cejas-field">
                    <label>Subtotal</label>
                    <input value={formatarMoeda(subtotalLinha)} readOnly />
                  </div>
                </div>

                <p className="cejas-small-info">
                  {catalogo.filter((item) => item.ativo).length} itens disponíveis no catálogo oficial. Valor muda automaticamente conforme associado/não associado e tipo de dia.
                </p>

                <button className="cejas-custom-btn primary" type="button" onClick={adicionarItemSelecionado}>
                  ✅ ADICIONAR ITEM SELECIONADO AO ORÇAMENTO
                </button>

                <button className="cejas-custom-btn" type="button" onClick={adicionarItemPersonalizado}>
                  ✎ + ITEM PERSONALIZADO / CORINGA
                </button>

                <button className="cejas-custom-btn" type="button" onClick={() => setModalAberto(true)}>
                  ⚙ CADASTRAR / EDITAR ITENS DO SISTEMA
                </button>
              </div>
            </div>
          </section>

          <section className="cejas-editor-section">
            <h2>💸 Desconto Manual</h2>
            <div className="cejas-field">
              <label>Desconto aplicado</label>
              <input type="number" min={0} value={desconto} onChange={(event) => setDesconto(Number(event.target.value))} />
            </div>

            <div className="cejas-total-line">
              <div className="cejas-field">
                <label>Total bruto</label>
                <input value={formatarMoeda(totalBruto)} readOnly />
              </div>
              <div className="cejas-field">
                <label>Total final</label>
                <input value={formatarMoeda(totalFinal)} readOnly />
              </div>
            </div>
          </section>

          {itens.length > 0 && (
            <section className="cejas-editor-section">
              <h2>Itens no orçamento</h2>
              <div style={{ display: "grid", gap: 8 }}>
                {itens.map((item) => (
                  <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                    <strong>{item.item}</strong>
                    <p className="cejas-small-info">{item.categoria}</p>
                    <p className="cejas-small-info">Qtd. {item.quantidade} • {formatarMoeda(item.valorUnitario)} • {formatarMoeda(item.valorFinal)}</p>
                    <button className="cejas-mini-btn delete" type="button" onClick={() => removerItemOrcamento(item.id)}>Remover</button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        <section className="cejas-preview">
          <div id="cejas-print-area" className="cejas-document-stack">
            {paginas.map((pagina, pageIndex) => {
              const ultimaPagina = pageIndex === paginas.length - 1;

              return (
                <article className="cejas-document" key={pageIndex}>
                  <div className="cejas-doc-header">
                    <div className="cejas-logo-box">CEJAS</div>

                    <div className="cejas-doc-company">
                      <strong>DOCUMENTO AUXILIAR DE VENDA - ORÇAMENTO</strong>
                      De: Centro Empresarial de Jaraguá do Sul - CEJAS<br />
                      CNPJ: 83.784.124/0001-32 - IE: Isenta<br />
                      Rua Octaviano Lombardi, 100. Czerniewicz | CEP 89255-055<br />
                      Jaraguá do Sul - SC<br />
                      (47) 3275-7000 – Fax (47) 3275-7001
                    </div>
                  </div>

                  <div className="cejas-doc-meta">
                    <span><strong>Data:</strong> {hojeBR()}</span>
                    <span><strong>Elaborado por:</strong> {emissor || "EDUARDO"}</span>
                  </div>

                  <div className="cejas-doc-title">ORÇAMENTO LOCAÇÃO DE SALAS E EQUIPAMENTOS</div>

                  <div className="cejas-doc-fields">
                    <div><strong>Solicitante:</strong> {solicitante || "________________________"}</div>
                    <div><strong>Evento:</strong> {evento || "________________________"}</div>
                    {status && <div><strong>Status:</strong> {status.toUpperCase()}</div>}
                  </div>

                  <div className="cejas-period-title">
                    {pagina[0]?.data ? `${dataBR(pagina[0].data)} ${pagina[0].inicio || ""}${pagina[0].fim ? ` às ${pagina[0].fim}` : ""}` : "DATA NÃO INFORMADA"}
                    {pageIndex > 0 ? " - CONTINUAÇÃO" : ""}
                  </div>

                  <table className="cejas-doc-table">
                    <thead>
                      <tr>
                        <th style={{ width: "32px" }}>Nº</th>
                        <th>Item / Sala</th>
                        <th style={{ width: "42px" }}>Qtd.</th>
                        <th>Detalhes / Recursos</th>
                        <th className="cejas-num">Valor unitário</th>
                        <th className="cejas-num">Valor final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagina.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>Nenhum item adicionado.</td>
                        </tr>
                      )}

                      {pagina.map((item, index) => (
                        <tr key={item.id}>
                          <td>{String(pageIndex * 14 + index + 1).padStart(2, "0")}</td>
                          <td>
                            <strong>{item.categoria}</strong><br />
                            {item.item}
                          </td>
                          <td>{item.quantidade}</td>
                          <td>{item.detalhes}</td>
                          <td className="cejas-num">{formatarMoeda(item.valorUnitario)}</td>
                          <td className="cejas-num">{formatarMoeda(item.valorFinal)}</td>
                        </tr>
                      ))}

                      {ultimaPagina && (
                        <>
                          <tr className="cejas-subtotal">
                            <td colSpan={5} className="cejas-num">Subtotal do período:</td>
                            <td className="cejas-num">{formatarMoeda(totalBruto)}</td>
                          </tr>
                          <tr className="cejas-subtotal">
                            <td colSpan={5} className="cejas-num">Desconto:</td>
                            <td className="cejas-num">{formatarMoeda(desconto)}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>

                  {ultimaPagina && (
                    <>
                      <div className="cejas-total-box">
                        <div><span>TOTAL GERAL:</span><span className="cejas-total-final">{formatarMoeda(totalFinal)}</span></div>
                      </div>

                      {(observacoesCliente || infos) && (
                        <div className="cejas-doc-fields">
                          {observacoesCliente && <div><strong>Observações:</strong> {observacoesCliente}</div>}
                          {infos && <div><strong>Info interna:</strong> {infos}</div>}
                        </div>
                      )}

                      <div className="cejas-conditions">
                        <h3>Observações e Condições</h3>
                        <div>
                          • Orçamento válido por <strong>72 horas</strong>. A pré-reserva garante o espaço por este período; após o prazo, o evento é considerado cancelado.
                          <div className="cejas-warning">Atenção: o horário limite para fechamento total do prédio é impreterivelmente às 22:00h.</div>
                          <strong>Formas de pagamento:</strong><br />
                          - Transferência/Depósito: Sicredi Norte (Ag 2602, c/c 04247-2, titular: CEJAS).<br />
                          - Boleto Bancário via Sicredi Norte.<br />
                          - PIX CNPJ: 83.784.124/0001-32
                        </div>
                      </div>

                      <div className="cejas-signature">
                        <div>
                          Permanecemos à disposição.<br /><br />
                          Atenciosamente,<br />
                          <strong>{emissor || "EDUARDO"}</strong>
                          Cel: (47) 98835-7184<br />
                          E-mail: comercial@cejas.com.br
                        </div>

                        <div className="cejas-system-mark">Sistema Comercial CEJAS v2026</div>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>

      {modalAberto && (
        <div className="cejas-modal-backdrop">
          <div className="cejas-modal">
            <div className="cejas-modal-header">
              <div>
                <h2>Cadastro de Itens do Orçamento</h2>
                <p style={{ margin: "4px 0 0", color: "#cbd5e1" }}>Cadastre, edite, use ou exclua itens da tabela.</p>
              </div>
              <button className="cejas-btn" type="button" onClick={() => setModalAberto(false)}>Fechar</button>
            </div>

            <div className="cejas-modal-body">
              <div className="cejas-modal-card">
                <h3 style={{ margin: "0 0 14px" }}>{formCatalogo.id ? "Editar item" : "Cadastrar novo item"}</h3>

                <div className="cejas-field">
                  <label>Categoria</label>
                  <input value={formCatalogo.categoria} onChange={(event) => setFormCatalogo({ ...formCatalogo, categoria: event.target.value })} />
                </div>

                <div className="cejas-field">
                  <label>Item</label>
                  <input value={formCatalogo.item} onChange={(event) => setFormCatalogo({ ...formCatalogo, item: event.target.value })} />
                </div>

                <h4>Associado</h4>
                <div className="cejas-values-grid">
                  <div className="cejas-field">
                    <label>Dias úteis</label>
                    <input type="number" value={formCatalogo.associado.diasUteis} onChange={(event) => setFormCatalogo({ ...formCatalogo, associado: { ...formCatalogo.associado, diasUteis: Number(event.target.value) } })} />
                  </div>
                  <div className="cejas-field">
                    <label>Sábado</label>
                    <input type="number" value={formCatalogo.associado.sabado} onChange={(event) => setFormCatalogo({ ...formCatalogo, associado: { ...formCatalogo.associado, sabado: Number(event.target.value) } })} />
                  </div>
                  <div className="cejas-field">
                    <label>Dom/Fer</label>
                    <input type="number" value={formCatalogo.associado.domingoFeriado} onChange={(event) => setFormCatalogo({ ...formCatalogo, associado: { ...formCatalogo.associado, domingoFeriado: Number(event.target.value) } })} />
                  </div>
                </div>

                <h4>Não associado</h4>
                <div className="cejas-values-grid">
                  <div className="cejas-field">
                    <label>Dias úteis</label>
                    <input type="number" value={formCatalogo.naoAssociado.diasUteis} onChange={(event) => setFormCatalogo({ ...formCatalogo, naoAssociado: { ...formCatalogo.naoAssociado, diasUteis: Number(event.target.value) } })} />
                  </div>
                  <div className="cejas-field">
                    <label>Sábado</label>
                    <input type="number" value={formCatalogo.naoAssociado.sabado} onChange={(event) => setFormCatalogo({ ...formCatalogo, naoAssociado: { ...formCatalogo.naoAssociado, sabado: Number(event.target.value) } })} />
                  </div>
                  <div className="cejas-field">
                    <label>Dom/Fer</label>
                    <input type="number" value={formCatalogo.naoAssociado.domingoFeriado} onChange={(event) => setFormCatalogo({ ...formCatalogo, naoAssociado: { ...formCatalogo.naoAssociado, domingoFeriado: Number(event.target.value) } })} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="cejas-btn blue" type="button" onClick={salvarItemCatalogo}>Salvar item</button>
                  <button className="cejas-btn" type="button" onClick={() => setFormCatalogo(criarFormVazio())}>Limpar</button>
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 14px" }}>Itens cadastrados ({catalogo.filter((item) => item.ativo).length})</h3>

                <div className="cejas-catalog-table-wrap">
                  <table className="cejas-catalog-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Categoria</th>
                        <th>Valor atual</th>
                        <th>Regra</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalogo.filter((item) => item.ativo).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.item}</strong>
                          </td>
                          <td>{item.categoria}</td>
                          <td>{formatarMoeda(getValorCatalogo(item, tipoCliente, tipoDia))}</td>
                          <td>
                            {tipoCliente === "associado" ? "Associado" : "Não associado"}<br />
                            {tipoDia === "diasUteis" ? "Dias úteis" : tipoDia === "sabado" ? "Sábado" : "Dom/Fer"}
                          </td>
                          <td>
                            <div className="cejas-action-column">
                              <button className="cejas-mini-btn use" type="button" onClick={() => usarItemDoCatalogo(item)}>Usar</button>
                              <button className="cejas-mini-btn edit" type="button" onClick={() => editarItemCatalogo(item)}>Editar</button>
                              <button className="cejas-mini-btn delete" type="button" onClick={() => excluirItemCatalogo(item.id)}>Excluir</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
