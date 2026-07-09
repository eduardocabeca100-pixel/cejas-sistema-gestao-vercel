import type { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/format/currency";

export function MonthlyRevenueList({ data }: { data: DashboardSummary["monthlyRevenue"] }) {
  if (!data.length) return <p className="muted">Nenhum evento confirmado ainda. Importe os relatórios de janeiro a dezembro para ver o total de cada mês aqui.</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
      {data.map((item) => (
        <div key={item.month} style={{ border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", background: "rgba(255,255,255,.03)" }}>
          <span className="muted" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em" }}>{item.month}</span>
          <div className="text-green" style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 900, marginTop: 4, letterSpacing: "-0.5px" }}>{formatCurrency(item.value)}</div>
          {item.gratuityLoss > 0 && (
            <div className="text-red" style={{ fontSize: 12, fontWeight: 800, marginTop: 6 }}>-{formatCurrency(item.gratuityLoss)} em gratuidades</div>
          )}
        </div>
      ))}
    </div>
  );
}
