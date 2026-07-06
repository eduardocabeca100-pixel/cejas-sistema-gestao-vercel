"use client";

import { useState } from "react";
import { dashboardSeed } from "@/lib/seed";
import { formatCurrency, formatNumber } from "@/lib/format/currency";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ImportarRelatorioPage() {
  const [summary, setSummary] = useState(dashboardSeed);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("Nenhum PDF importado ainda.");
  const [loading, setLoading] = useState(false);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setStatus("Enviando PDF para Supabase Storage...");
    try {
      const response = await fetch("/api/import-report", { method: "POST", body: form });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || "Erro ao importar PDF.");
      if (json.summary) setSummary({ ...dashboardSeed, totalEvents: json.summary.total_events, confirmedEvents: json.summary.confirmed_events, pendingEvents: json.summary.pending_events, canceledEvents: json.summary.canceled_events, expectedRevenue: json.summary.expected_revenue, confirmedRevenue: json.summary.confirmed_revenue, discountsApplied: json.summary.discounts_applied, source: "Supabase Database", updatedAt: new Date().toISOString() });
      setStatus(json.message || "PDF salvo no Storage e resumo registrado no banco.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao importar PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="IMPORTAÇÃO OFICIAL" title="Importar Relatório PDF" description="Envie o PDF do Supera. O arquivo original fica no Supabase Storage e o resumo no Supabase Database. Nenhum evento mock é criado." actions={<Button variant="dark">Ver histórico</Button>} />
      <div className="grid grid-4"><MetricCard label="Total de eventos" value={formatNumber(summary.totalEvents)} /><MetricCard label="Confirmados" value={formatNumber(summary.confirmedEvents)} tone="green" /><MetricCard label="Em espera" value={formatNumber(summary.pendingEvents)} tone="purple" /><MetricCard label="Cancelados" value={formatNumber(summary.canceledEvents)} tone="red" /></div>
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <Card className="pad"><h2>Upload do relatório</h2><form onSubmit={upload}><label className="upload-zone"><input name="file" type="file" accept="application/pdf" style={{ display: "none" }} onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} /><div><strong>📄 Arraste ou selecione o PDF do Supera</strong><p>{fileName || "Nenhum arquivo selecionado"}</p></div></label><div className="upload-actions"><Button type="submit">{loading ? "Importando..." : "Importar PDF"}</Button><Button type="button" variant="dark" onClick={() => { setFileName(""); setSummary(dashboardSeed); setStatus("Tela limpa."); }}>Limpar tela</Button></div></form><p className="muted" style={{ marginTop: 18 }}>{status}</p></Card>
        <Card className="pad"><h2>Resumo detectado</h2><div className="grid grid-2"><Card className="metric-card"><b className="text-green">● Receita confirmada</b><strong>{formatCurrency(summary.confirmedRevenue)}</strong></Card><Card className="metric-card"><b className="text-red">● Descontos</b><strong>{formatCurrency(summary.discountsApplied)}</strong></Card><Card className="metric-card"><b className="text-purple">● Faturamento previsto</b><strong>{formatCurrency(summary.expectedRevenue)}</strong></Card><Card className="metric-card"><b className="text-red">● Cancelados</b><strong>{formatNumber(summary.canceledEvents)}</strong></Card></div></Card>
      </div>
    </div>
  );
}
