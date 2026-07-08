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
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      setStatus("Selecione um arquivo PDF antes de importar.");
      return;
    }

    setLoading(true);
    try {
      setStatus("Preparando upload...");
      const signResponse = await fetch("/api/import-report/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name })
      });
      const signJson = await signResponse.json();
      if (!signJson.ok) throw new Error(signJson.error || "Não foi possível iniciar o upload.");

      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada na Vercel. Adicione essa variável de ambiente e faça um novo deploy.");

      setStatus("Enviando PDF para o Supabase Storage...");
      const putResponse = await fetch(signJson.signedUrl, {
        method: "PUT",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "content-type": file.type || "application/pdf",
          "x-upsert": "true"
        },
        body: file
      });
      if (!putResponse.ok) throw new Error(`Falha ao enviar o arquivo para o Storage (HTTP ${putResponse.status}).`);

      setStatus("Lendo o PDF e calculando o resumo...");
      const finalizeResponse = await fetch("/api/import-report/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: signJson.path, fileName: file.name })
      });
      const finalizeJson = await finalizeResponse.json();
      if (!finalizeJson.ok) throw new Error(finalizeJson.error || "Erro ao processar o PDF.");

      if (finalizeJson.summary) {
        const s = finalizeJson.summary;
        setSummary({
          ...dashboardSeed,
          totalEvents: s.total_events,
          confirmedEvents: s.confirmed_events,
          pendingEvents: s.pending_events,
          canceledEvents: s.canceled_events,
          expectedRevenue: s.expected_revenue,
          confirmedRevenue: s.confirmed_revenue,
          discountsApplied: s.discounts_applied,
          source: "Supabase Database",
          updatedAt: new Date().toISOString()
        });
      }
      setStatus(finalizeJson.message || "PDF salvo no Storage e resumo registrado no banco.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao importar PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="IMPORTAÇÃO OFICIAL" title="Importar Relatório PDF" description="Envie o relatório 'Agendamentos de Salas e Equipamentos' do Supera. Cada importação substitui os eventos importados anteriormente (não duplica) e atualiza a Agenda, o Painel do Dia e o Dashboard para todos os usuários. Eventos criados manualmente na Agenda não são afetados." />
      <div className="grid grid-4"><MetricCard label="Total de eventos" value={formatNumber(summary.totalEvents)} /><MetricCard label="Confirmados" value={formatNumber(summary.confirmedEvents)} tone="green" /><MetricCard label="Em espera" value={formatNumber(summary.pendingEvents)} tone="purple" /><MetricCard label="Cancelados" value={formatNumber(summary.canceledEvents)} tone="red" /></div>
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <Card className="pad"><h2>Upload do relatório</h2><form onSubmit={upload}><label className="upload-zone"><input name="file" type="file" accept="application/pdf" style={{ display: "none" }} onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} /><div><strong>📄 Arraste ou selecione o PDF do Supera</strong><p>{fileName || "Nenhum arquivo selecionado"}</p></div></label><div className="upload-actions"><Button type="submit" disabled={loading}>{loading ? "Importando..." : "Importar PDF"}</Button><Button type="button" variant="dark" onClick={() => { setFileName(""); setSummary(dashboardSeed); setStatus("Tela limpa."); }}>Limpar tela</Button></div></form><p className="muted" style={{ marginTop: 18 }}>{status}</p></Card>
        <Card className="pad"><h2>Resumo detectado</h2><div className="grid grid-2"><Card className="metric-card"><b className="text-green">● Receita confirmada</b><strong>{formatCurrency(summary.confirmedRevenue)}</strong></Card><Card className="metric-card"><b className="text-red">● Descontos</b><strong>{formatCurrency(summary.discountsApplied)}</strong></Card><Card className="metric-card"><b className="text-purple">● Faturamento previsto</b><strong>{formatCurrency(summary.expectedRevenue)}</strong></Card><Card className="metric-card"><b className="text-red">● Cancelados</b><strong>{formatNumber(summary.canceledEvents)}</strong></Card></div></Card>
      </div>
    </div>
  );
}
