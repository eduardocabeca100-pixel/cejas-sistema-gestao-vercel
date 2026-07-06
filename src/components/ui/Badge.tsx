import { cx } from "@/lib/utils";
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "purple" | "red" | "blue" | "neutral" | "yellow" }) { return <span className={cx("badge", `badge-${tone}`)}>{children}</span>; }
