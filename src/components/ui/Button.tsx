import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/utils";
type ButtonVariant = "primary" | "dark" | "danger" | "ghost" | "blue";
export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) { return <button className={cx("btn", `btn-${variant}`, className)} {...props} />; }
