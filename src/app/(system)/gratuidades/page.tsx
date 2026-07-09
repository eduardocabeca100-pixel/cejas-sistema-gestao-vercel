"use client";

import { useEffect, useMemo, useState } from "react";
import type { Gratuity, GratuityType } from "@/types";
import { formatCurrency, parseCurrencyInput } from "@/lib/format/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

function isSupera(item: Gratuity) {
  return item.notes.startsWith("[Supera]");
}

function notesSemPrefixo(item: Gratuity) {
  return isSupera(item) ? item.notes.replace(/^\[Supera\]\s*/, "") : item.notes;
}

function paraCampoValor(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export default function GratuidadesPage() {
  const [gratuities, setGratuities] = useState<Gratuity[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = gratuities.find((g) => g.id === editingId) || null;
  const [totalValue, setTotalValue] = useState("");
  const [paidValue, setPaidValue] = useState("");
  const loss = parseCurrencyInput(paidValue) - parseCurrencyInput(totalValue);

  function carregar() {
    fetch("/api/gratuidades", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setGratuities).catch(() => setGratuities([]));
  }

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    setTotalValue(editing ? paraCampoValor(editing.totalValue) : "");
    setPaidValue(editing ? paraCampoValor(editing.paidValue) : "");
  }, [editingId]);

  const totals = useMemo(() => ({
    total: gratuities.reduce((s, g) => s + g.totalValue, 0),
    paid: gratuities.reduce((s, g) => s + g.paidValue, 0),
    loss: gratuities.reduce((s, g) => s + g.lossValue, 0)
  }), [gratuities]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Omit<Gratuity, "id" | "lossValue"> & { lossValue?: number } = {
      date: String(form.get("date")),
      event: String(form.get("event")),
      beneficiary: String(form.get("beneficiary")),
      type: String(form.get("type")) as GratuityType,
      totalValue: parseCurrencyInput(totalValue),
      paidValue: parseCurrencyInput(paidValue),
      notes: String(form.get("notes")),
      responsible: String(form.get("responsible") || "Eduardo"),
      status: String(form.get("status") || "ativo")
    };

    if (editingId) {
      await fetch("/api/gratuidades", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, ...payload }) });
      setEditingId(null);
      carregar();
      return;
    }

    const response = await fetch("/api/gratuidades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await response.json();
    const item: Gratuity = { id: `grat-${Date.now()}`, ...payload, lossValue: json.gratuity?.loss_value ?? loss };
    setGratuities((current) => [item, ...current]);
    (event.target as HTMLFormElement).reset();
    setTotalValue("");
    setPaidValue("");
  }

  async function excluir(id: string) {
    if (!window.confirm("Excluir esta gratuidade?")) return;
    await fetch(`/api/gratuidades?id=${id}`, { method: "DELETE" });
    if (editingId === id) setEditingId(null);
    carregar();
  }

  return (
    <div>
      <PageHeader eyebrow="CONTROLE MANUAL" title="Gratuidades" description="Cadastro manual de gratuidades. Desconto financeiro e gratuidade são controles separados." actions={<Button>Novo lançamento</Button>} />
      <div className="grid grid-4"><MetricCard label="Valor total" value={formatCurrency(totals.total)} /><MetricCard label="Valor pago" value={formatCurrency(totals.paid)} tone="green" /><MetricCard label="Valor de perda" value={formatCurrency(totals.loss)} tone="red" /><MetricCard label="Registros" value={gratuities.length} tone="purple" /></div>
      <Card className="filters" style={{ marginTop: 22 }}><h2>Filtros</h2><p>Filtre por período, origem, evento ou órgão.</p><div className="filter-grid"><Field label="De"><TextInput type="date" /></Field><Field label="Até"><TextInput type="date" /></Field><Field label="Origem"><SelectInput><option>Todas</option><option>Manual</option><option>Supera</option></SelectInput></Field><Field label="Buscar"><TextInput placeholder="Evento, órgão, associado..." /></Field><Button>Filtrar</Button></div></Card>
      <Card className="pad" style={{ marginTop: 22 }}>
        <div className="page-header" style={{ marginBottom: 0 }}><div><h2>{editingId ? "Editar gratuidade" : "Cadastrar gratuidade"}</h2><p>O valor de perda é calculado automaticamente como negativo: valor pago menos valor total.</p></div>{editingId && <Button type="button" variant="dark" onClick={() => setEditingId(null)}>Cancelar edição</Button>}</div>
        <form className="grid" onSubmit={save} key={editingId || "novo"}>
          <div className="grid grid-3"><Field label="Data"><TextInput name="date" type="date" defaultValue={editing?.date} required /></Field><Field label="Evento"><TextInput name="event" placeholder="Nome do evento" defaultValue={editing?.event} required /></Field><Field label="Órgão / associado / não associado"><TextInput name="beneficiary" placeholder="Ex: SCAR, SENAI, PMJS, NÃO ASSOCIADO" defaultValue={editing?.beneficiary} required /></Field></div>
          <div className="grid grid-4"><Field label="Tipo"><SelectInput name="type" defaultValue={editing?.type || "orgao"}><option value="orgao">Órgão</option><option value="associado">Associado</option><option value="nao_associado">Não associado</option></SelectInput></Field><Field label="Valor total"><TextInput value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="Ex: 4200,00" /></Field><Field label="Valor pago"><TextInput value={paidValue} onChange={(e) => setPaidValue(e.target.value)} placeholder="Ex: 0,00" /></Field><Field label="Valor de perda"><TextInput value={formatCurrency(loss)} readOnly /></Field></div>
          <Field label="Observação"><TextArea name="notes" placeholder="Motivo da gratuidade, autorização, detalhes..." defaultValue={editing ? notesSemPrefixo(editing) : ""} /></Field>
          <div className="grid grid-3"><Field label="Responsável"><TextInput name="responsible" defaultValue={editing?.responsible || "Eduardo"} /></Field><Field label="Status"><SelectInput name="status" defaultValue={editing?.status || "ativo"}><option value="ativo">Ativo</option><option value="revisao">Em revisão</option><option value="cancelado">Cancelado</option></SelectInput></Field><div style={{ alignSelf: "end", display: "flex", gap: 10, justifyContent: "flex-end" }}><Button type="submit">{editingId ? "Salvar alterações" : "Salvar"}</Button></div></div>
        </form>
      </Card>
      <Card className="pad" style={{ marginTop: 22 }}><h2>Gráficos de déficit por gratuidade</h2><p>Os gráficos mostram os valores de perda sempre negativos.</p><div className="grid grid-2"><Card className="pad deficit-box"><b>Valor de perda por mês</b>{gratuities.length ? formatCurrency(totals.loss) : "Sem dados para este gráfico."}</Card><Card className="pad"><h3>Origem da gratuidade</h3><div style={{ display: "grid", gridTemplateColumns: "120px 1fr 100px", gap: 16, alignItems: "center" }}><b>Manual</b><div className="progress-line"><span /></div><b className="text-red">{formatCurrency(totals.loss)}</b></div></Card></div><Card className="pad deficit-box" style={{ marginTop: 18 }}><b>Órgão / associado / não associado</b>{gratuities.length ? `${gratuities.length} registro(s)` : "Sem dados para este gráfico."}</Card></Card>
      <Card className="table-card" style={{ marginTop: 22 }}><div className="table-top"><div><h2>Lista de gratuidades</h2><p className="muted">Formato igual ao controle da planilha.</p></div></div><table className="data-table"><thead><tr><th>Data</th><th>Evento</th><th>Valor total</th><th>Valor pago</th><th>Valor de perda</th><th>Órgão / associado / não associado</th><th>Origem</th><th>Ações</th></tr></thead><tbody>{gratuities.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center" }}>Nenhuma gratuidade encontrada.</td></tr> : gratuities.map((item) => <tr key={item.id}><td>{item.date.split("-").reverse().join("/")}</td><td><b>{item.event}</b></td><td>{formatCurrency(item.totalValue)}</td><td>{formatCurrency(item.paidValue)}</td><td className="text-red">{formatCurrency(item.lossValue)}</td><td>{item.beneficiary}</td><td><Badge tone={isSupera(item) ? "blue" : "purple"}>{isSupera(item) ? "Supera" : "Manual"}</Badge></td><td className="action-cell"><Button variant="dark" onClick={() => setEditingId(item.id)}>Editar</Button><Button variant="danger" onClick={() => excluir(item.id)}>Excluir</Button></td></tr>)}</tbody></table></Card>
    </div>
  );
}
