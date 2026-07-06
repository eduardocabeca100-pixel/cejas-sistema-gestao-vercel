"use client";

import { useEffect, useState } from "react";
import type { FinanceEntry } from "@/types";
import { formatCurrency } from "@/lib/format/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function FinanceiroPage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const confirmed = entries.reduce((sum, entry) => sum + entry.amount, 0);

  useEffect(() => {
    fetch("/api/financeiro", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setEntries).catch(() => setEntries([]));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="FINANCEIRO / FATURAMENTO" title="Controle financeiro" description="Receitas, despesas, pagamentos, status, vínculo com eventos/orçamentos e fluxo de caixa." actions={<><Button>Nova receita</Button><Button variant="dark">Nova despesa</Button></>} />
      <div className="grid grid-4">
        <MetricCard label="Receita no período" value={formatCurrency(confirmed)} tone="green" />
        <MetricCard label="Pagamentos pendentes" value={entries.filter((e) => e.paymentStatus === "Pendente").length} tone="yellow" />
        <MetricCard label="Faturamento em aberto" value={entries.filter((e) => e.billingStatus === "Em aberto").length} tone="purple" />
        <MetricCard label="Arquivos vinculados" value={entries.reduce((s,e) => s + e.filesCount, 0)} />
      </div>
      <Card className="filters" style={{ marginTop: 22 }}>
        <div className="filter-grid">
          <Field label="Mês"><SelectInput><option>Julho de 2026</option><option>Todos</option></SelectInput></Field>
          <Field label="Pagamento"><SelectInput><option>Todos</option><option>Pendente</option><option>Pago</option><option>Atrasado</option></SelectInput></Field>
          <Field label="Faturamento"><SelectInput><option>Todos</option><option>Em aberto</option><option>Faturado</option></SelectInput></Field>
          <Field label="Buscar"><TextInput placeholder="Buscar cliente, evento, boleto, demonstrativo..." /></Field>
          <Button>Aplicar filtros</Button>
        </div>
      </Card>
      <Card className="table-card" style={{ marginTop: 22 }}>
        <div className="table-top"><h2>Controle financeiro</h2><TextInput style={{ maxWidth: 480 }} placeholder="Buscar cliente, evento, boleto, demonstrativo..." /></div>
        <table className="data-table">
          <thead><tr><th>Cliente / Evento</th><th>Orçamentos</th><th>Boleto</th><th>Demonstrativo</th><th>Pagamento</th><th>Faturamento</th><th>Arquivos</th><th>Ações</th></tr></thead>
          <tbody>{entries.map((entry) => <tr key={entry.id}><td><b>{entry.client}</b><br /><span className="muted">Data: {entry.date ? entry.date.split("-").reverse().join("/") : "não informada"}</span></td><td>{entry.budgetLabel ? <div><b>{entry.budgetLabel}</b><br /><a>Abrir PDF</a></div> : <span className="muted">Nenhum orçamento localizado</span>}</td><td><Badge tone={entry.boletoStatus === "Emitido" ? "green" : "blue"}>{entry.boletoStatus}</Badge><SelectInput defaultValue={entry.boletoStatus}><option>Não emitido</option><option>Emitido</option><option>Enviado</option></SelectInput></td><td><Badge tone={entry.demonstrativoStatus === "Emitido" ? "green" : "blue"}>{entry.demonstrativoStatus}</Badge><SelectInput defaultValue={entry.demonstrativoStatus}><option>Não emitido</option><option>Emitido</option><option>Enviado</option></SelectInput></td><td><Badge tone="blue">{entry.paymentStatus}</Badge><SelectInput defaultValue={entry.paymentStatus}><option>Pendente</option><option>Pago</option><option>Atrasado</option></SelectInput></td><td><Badge tone="blue">{entry.billingStatus}</Badge><SelectInput defaultValue={entry.billingStatus}><option>Em aberto</option><option>Faturado</option><option>Cancelado</option></SelectInput></td><td>Orçamentos: {entry.budgetLabel ? 1 : 0}<br />Boletos: {entry.boletoStatus === "Emitido" ? 1 : 0}<br />Demonstrativos: {entry.demonstrativoStatus === "Emitido" ? 1 : 0}</td><td><Button variant="danger">Apagar</Button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
