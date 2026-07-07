"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";
const navItems = [
  { href: "/dashboard", label: "Painel Geral", icon: "▦" }, { href: "/agenda", label: "Agenda Dinâmica", icon: "▣" }, { href: "/painel-do-dia", label: "Painel do Dia", icon: "▤" }, { href: "/chat", label: "Chat Interno", icon: "💬" }, { href: "/orcamentos", label: "Orçamentos", icon: "◎" }, { href: "/financeiro", label: "Financeiro", icon: "💰" }, { href: "/gratuidades", label: "Gratuidades", icon: "☞" }, { href: "/tarefas", label: "Tarefas Pendentes", icon: "☑" }, { href: "/servidor", label: "Servidor", icon: "▣" }, { href: "/contratos", label: "Contratos", icon: "▥" }, { href: "/importar-relatorio", label: "Importar Relatório (PDF)", icon: "▤" }, { href: "/usuarios", label: "Acessos / Usuários", icon: "•" }, { href: "/configuracoes", label: "Configurações", icon: "⊙" }
];
export function Sidebar() {
  const pathname = usePathname();
  return <aside className="sidebar"><Link className="brand" href="/dashboard"><div className="brand-mark">M</div><div><strong>SISTEMA DE GESTÃO<br />CEJAS</strong><span>Painel Administrativo</span></div></Link><div className="user-card"><div className="avatar">E</div><div><strong>Eduardo</strong><span>Superadmin</span></div></div><nav className="side-nav">{navItems.map((item) => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link className={cx("nav-link", active && "active")} href={item.href} key={item.href}><span>{item.icon}</span>{item.label}</Link>; })}</nav><div className="sidebar-help"><strong>Controle de gestão</strong><span>Sistema escuro, seguro e persistente via Supabase.</span></div><div className="sidebar-footer"><Link className="logout-link" href="/">⏻ Sair do sistema</Link></div></aside>;
}
