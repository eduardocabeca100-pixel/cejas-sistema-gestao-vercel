"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cx } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth/session";

const navItems = [
  { href: "/dashboard", label: "Painel Geral", icon: "▦" }, { href: "/agenda", label: "Agenda Dinâmica", icon: "▣" }, { href: "/painel-do-dia", label: "Painel do Dia", icon: "▤" }, { href: "/chat", label: "Chat Interno", icon: "💬" }, { href: "/orcamentos", label: "Orçamentos", icon: "◎" }, { href: "/financeiro", label: "Financeiro", icon: "💰" }, { href: "/gratuidades", label: "Gratuidades", icon: "☞" }, { href: "/tarefas", label: "Tarefas Pendentes", icon: "☑" }, { href: "/servidor", label: "Servidor", icon: "▣" }, { href: "/contratos", label: "Contratos", icon: "▥" }, { href: "/importar-relatorio", label: "Importar Relatório (PDF)", icon: "▤" }, { href: "/usuarios", label: "Acessos / Usuários", icon: "•" }, { href: "/configuracoes", label: "Configurações", icon: "⊙" }
];

export function Sidebar({ user }: { user: SessionPayload | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const nome = user?.name || "Usuário";
  const cargo = user?.isSuperadmin ? "Superadmin" : (user?.role || "");

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
      <div className="user-card"><div className="avatar">{nome.charAt(0).toUpperCase()}</div><div><strong>{nome}</strong><span>{cargo}</span></div></div>
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
