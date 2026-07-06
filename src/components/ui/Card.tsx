import { cx } from "@/lib/utils";
export function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) { return <section className={cx("card", className)} style={style}>{children}</section>; }
