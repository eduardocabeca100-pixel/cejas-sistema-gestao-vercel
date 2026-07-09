import { cx } from "@/lib/utils";
export function Card({ children, className, style, id }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; id?: string }) { return <section id={id} className={cx("card", className)} style={style}>{children}</section>; }
