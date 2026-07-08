import type { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/format/currency";

export function MonthlyRevenueList({ data }: { data: DashboardSummary["monthlyRevenue"] }) {
  if (!data.length) return <p className="muted">Nenhum evento confirmado ainda. Importe os relatórios de janeiro a dezembro para ver o total de cada mês aqui.</p>;

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {data.map((item) => (
        <div key={item.month}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>{item.month}</span>
            <strong className="text-green" style={{ fontSize: "clamp(18px, 2vw, 26px)" }}>{formatCurrency(item.value)}</strong>
          </div>
          <div className="progress-line" style={{ marginTop: 6 }}>
            <span style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
