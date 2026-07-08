export interface AppModule {
  href: string;
  label: string;
  icon: string;
  permissionLabel: string;
  alwaysVisible?: boolean;
  superadminOnly?: boolean;
}

export const APP_MODULES: AppModule[] = [
  { href: "/dashboard", label: "Painel Geral", icon: "▦", permissionLabel: "Painel Geral", alwaysVisible: true },
  { href: "/agenda", label: "Agenda Dinâmica", icon: "▣", permissionLabel: "Agenda Dinâmica" },
  { href: "/painel-do-dia", label: "Painel do Dia", icon: "▤", permissionLabel: "Painel do Dia" },
  { href: "/chat", label: "Chat Interno", icon: "💬", permissionLabel: "Chat Interno" },
  { href: "/orcamentos", label: "Orçamentos", icon: "◎", permissionLabel: "Orçamentos" },
  { href: "/financeiro", label: "Financeiro", icon: "💰", permissionLabel: "Financeiro" },
  { href: "/gratuidades", label: "Gratuidades", icon: "☞", permissionLabel: "Gratuidades" },
  { href: "/tarefas", label: "Tarefas Pendentes", icon: "☑", permissionLabel: "Tarefas Pendentes" },
  { href: "/servidor", label: "Servidor", icon: "▣", permissionLabel: "Servidor" },
  { href: "/contratos", label: "Contratos", icon: "▥", permissionLabel: "Contratos" },
  { href: "/importar-relatorio", label: "Importar Relatório (PDF)", icon: "▤", permissionLabel: "Importar Relatório PDF" },
  { href: "/usuarios", label: "Acessos / Usuários", icon: "•", permissionLabel: "Acessos / Usuários", superadminOnly: true },
  { href: "/configuracoes", label: "Configurações", icon: "⊙", permissionLabel: "Configurações" }
];

export function podeAcessarModulo(module: AppModule, isSuperadmin: boolean, permissions: string[]): boolean {
  if (isSuperadmin) return true;
  if (module.superadminOnly) return false;
  if (module.alwaysVisible) return true;
  return permissions.includes(module.permissionLabel);
}
