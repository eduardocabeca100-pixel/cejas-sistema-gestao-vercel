import type { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/format/currency";
export function BarChart({ data }: { data: DashboardSummary["monthlyRevenue"] }) { const max = Math.max(...data.map((i) => i.value), 1); return <div className="bar-chart">{data.map((item) => <div className="bar-item" key={item.month} title={`${item.month}: ${formatCurrency(item.value)}`}><div className="bar-track"><span style={{ height: `${Math.max((item.value / max) * 100, 8)}%` }} /></div><small>{item.month}</small></div>)}</div>; }
