"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardSeed } from "@/lib/seed";
import type { DashboardSummary } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/format/currency";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { BarChart } from "@/components/dashboard/BarChart";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { TextInput } from "@/components/ui/Form";

const modules = [
  { href: "/agenda", icon: "📅", title: "Agenda Dinâmica", text: "Reuniões, compromissos e eventos do escritório.", action: "Abrir agenda" },
  { href: "/orcamentos", icon: "💰", title: "Orçamentos", text: "Crie, acompanhe e gerencie propostas comerciais.", action: "Ver orçamentos" },
  { href: "/gratuidades", icon: "☞", title: "Gratuidades", text: "Controle valores, pagos e perdas por mês ou período.", action: "Abrir gratuidades" },
  { href: "/importar-relatorio", icon: "📄", title: "Importar Relatório", text: "Importe relatórios do Supera em PDF.", action: "Importar agora" },
  { href: "/tarefas", icon: "☑", title: "Tarefas", text: "Acompanhe tarefas prioritárias do dia.", action: "Ver tarefas" },
  { href: "/configuracoes", icon: "⚙️", title: "Configurações", text: "Personalize o sistema conforme a necessidade.", action: "Abrir configurações" }
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(dashboardSeed);
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.ok) setSummary(await response.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  return (
    <div>
      <Card className="dashboard-hero">
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <span className="eyebrow">SISTEMA LIMPO • AGUARDANDO DADOS</span>
            <h1>Dashboard de Resultados</h1>
            <p>Fonte: {summary.source}</p>
          </div>
          <Button onClick={loadDashboard}>{loading ? "Atualizando..." : "Atualizar dados"}</Button>
        </div>
        <div className="grid grid-4">
          <MetricCard label="Total de eventos" value={formatNumber(summary.totalEvents)} hint={`${formatNumber(summary.totalEvents)} eventos na lista`} tone="green" />
          <MetricCard label="Confirmados" value={formatNumber(summary.confirmedEvents)} hint="eventos confirmados" tone="green" />
          <MetricCard label="Em espera" value={formatNumber(summary.pendingEvents)} hint="eventos em espera" tone="yellow" />
          <MetricCard label="Status" value="Supabase OK" hint="sem fallback local" tone="green" />
        </div>
      </Card>

      <PageHeader
        eyebrow="SISTEMA DE GESTÃO CEJAS"
        title="Dashboard de Resultados"
        description={`Sistema limpo • Atualizado em ${summary.updatedAt ? new Date(summary.updatedAt).toLocaleString("pt-BR") : "carregando..."}`}
        actions={<><TextInput className="search-global" placeholder="Buscar em todo o sistema..." /><Button onClick={loadDashboard}>Atualizar dados</Button><Link href="/"><Button variant="dark">Sair</Button></Link></>}
      />

      <div className="grid grid-4">
        <MetricCard label="Faturamento previsto" value={formatCurrency(summary.expectedRevenue)} hint={`${formatNumber(summary.totalEvents)} eventos no relatório`} tone="green" />
        <MetricCard label="Receita confirmada" value={formatCurrency(summary.confirmedRevenue)} hint={`${formatNumber(summary.confirmedEvents)} eventos confirmados`} tone="green" />
        <MetricCard label="Descontos aplicados" value={formatCurrency(summary.discountsApplied)} hint={`${formatCurrency(summary.discountsApplied)} em descontos`} tone="red" />
        <MetricCard label="Eventos pendentes" value={formatNumber(summary.pendingEvents)} hint={`${formatNumber(summary.confirmedEvents)} confirmados • ${formatNumber(summary.canceledEvents)} cancelados`} tone="purple" />
      </div>

      <Card className="pad" style={{ marginTop: 22 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h2>Receita mensal confirmada</h2>
            <p>Valores calculados somente a partir dos registros salvos no Supabase. Enquanto nenhum relatório for importado, o painel permanece zerado.</p>
          </div>
          <Link href="/gratuidades"><Button>Abrir gratuidades</Button></Link>
        </div>
        <div className="gratuity-strip">
          <div>
            <span className="kicker">GRATUIDADES</span>
            <strong>{formatCurrency(summary.gratuitiesLoss)}</strong>
          </div>
          <Link href="/gratuidades"><Button variant="dark">Ver detalhes →</Button></Link>
        </div>
      </Card>

      <Card className="pad" style={{ marginTop: 22 }}>
        <h2>Módulos e Ferramentas</h2>
        <div className="module-grid">
          {modules.map((module) => (
            <Link href={module.href} className="module-card" key={module.href}>
              <span className="icon">{module.icon}</span>
              <div>
                <h3>{module.title}</h3>
                <p>{module.text}</p>
              </div>
              <span>{module.action} →</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-3" style={{ marginTop: 22, alignItems: "stretch" }}>
        <Card className="pad">
          <h2>Receita confirmada por mês</h2>
          <BarChart data={summary.monthlyRevenue} />
        </Card>
        <Card className="pad">
          <h2>Fluxo de Caixa</h2>
          <span className="kicker">SALDO ATUAL</span>
          <strong className="metric-value text-green">{formatCurrency(summary.cashBalance)}</strong>
          <div className="flow-box" style={{ marginTop: 18 }}>Gráfico de fluxo de caixa</div>
        </Card>
        <Card className="pad">
          <h2>Agenda do Mês</h2>
          <p className="muted">agenda limpa</p>
          <MiniCalendar />
        </Card>
      </div>
    </div>
  );
}
