import { Card } from "@/components/ui/Card";
import { cx } from "@/lib/utils";
export function MetricCard({ label, value, hint, tone = "white" }: { label: string; value: string | number; hint?: string; tone?: "white" | "green" | "purple" | "red" | "yellow" }) { return <Card className="metric-card"><span className="kicker">{label}</span><strong className={cx("metric-value", `text-${tone}`)}>{value}</strong>{hint && <small className={cx("metric-hint", tone !== "white" && `text-${tone}`)}>{hint}</small>}</Card>; }
