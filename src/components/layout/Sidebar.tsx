"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cx } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth/session";
import { APP_MODULES, podeAcessarModulo } from "@/lib/modules";

export function Sidebar({ user }: { user: SessionPayload | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const nome = user?.name || "Usuário";
  const cargo = user?.isSuperadmin ? "Superadmin" : (user?.role || "");
  const permissions = user?.permissions || [];
  const isSuperadmin = Boolean(user?.isSuperadmin);
  const navItems = APP_MODULES.filter((module) => podeAcessarModulo(module, isSuperadmin, permissions));

  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <Link className="brand" href="/dashboard">
        <div className="brand-mark">M</div>
        <div><strong>SISTEMA DE GESTÃO<br />CEJAS</strong><span>Painel Administrativo</span></div>
      </Link>
      <div className="user-card"><div className="avatar">{nome.charAt(0).toUpperCase()}</div><div><strong>{nome}</strong><span>{cargo}</span>{user?.email && <span style={{ fontSize: 11, opacity: 0.8 }}>{user.email}</span>}</div></div>
      <nav className="side-nav">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return <Link className={cx("nav-link", active && "active")} href={item.href} key={item.href}><span>{item.icon}</span>{item.label}</Link>;
        })}
      </nav>
      <div className="sidebar-help"><strong>Controle de gestão</strong><span>Sistema escuro, seguro e persistente via Supabase.</span></div>
      <div className="sidebar-footer"><button type="button" className="logout-link" onClick={sair} style={{ width: "100%", font: "inherit", cursor: "pointer" }}>⏻ Sair do sistema</button></div>
    </aside>
  );
}
