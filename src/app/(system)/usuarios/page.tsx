"use client";

import { useEffect, useState } from "react";
import type { AppUser } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Form";
import { PageHeader } from "@/components/ui/PageHeader";

const permissionOptions = ["Painel Geral", "Agenda Dinâmica", "Orçamentos", "Importar Relatório PDF", "Tarefas Pendentes", "Financeiro", "Servidor", "Gratuidades", "Configurações"];

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/usuarios", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setUsers).catch(() => setUsers([]));
  }, []);

  function togglePermission(value: string) {
    setPermissions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      role: String(form.get("role")),
      status: String(form.get("status")),
      permissions
    };
    const response = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await response.json();
    if (!json.ok) return alert(json.error);
    setUsers((current) => [{ id: `usr-${Date.now()}`, ...payload } as AppUser, ...current]);
  }

  return (
    <div>
      <PageHeader eyebrow="CONTROLE DE ACESSO" title="Acessos / Usuários" description="Crie usuários institucionais e escolha mais de uma permissão para cada pessoa." actions={<Button>Voltar ao painel</Button>} />
      <div className="grid grid-2">
        <Card className="pad">
          <h2>Novo usuário</h2>
          <form className="grid" onSubmit={saveUser}>
            <Field label="Nome"><TextInput name="name" placeholder="Nome completo" required /></Field>
            <Field label="E-mail institucional"><TextInput name="email" placeholder="nome@cejas.com.br" type="email" required /></Field>
            <Field label="Cargo / Função"><TextInput name="roleText" placeholder="Financeiro, Administração, Recepção..." /></Field>
            <Field label="Tipo"><SelectInput name="role"><option>Administrador</option><option>Financeiro</option><option>Comercial</option><option>Operacional</option><option>Leitura</option><option>Superadmin</option></SelectInput></Field>
            <Field label="Status"><SelectInput name="status"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></SelectInput></Field>
            <Field label="Senha inicial / nova senha"><TextInput type="password" placeholder="Mínimo 6 caracteres" /></Field>
            <div>
              <span className="kicker">Permissões</span>
              <div className="radio-stack">
                {permissionOptions.map((option) => <label key={option}><input type="checkbox" checked={permissions.includes(option)} onChange={() => togglePermission(option)} /> {option.toUpperCase()}</label>)}
              </div>
            </div>
            <Button type="submit">Salvar usuário</Button>
            <Button type="reset" variant="dark">Limpar</Button>
            <div className="sidebar-help" style={{ marginTop: 0 }}><strong>Regra:</strong> só é permitido cadastrar usuários com e-mail institucional <b>@cejas.com.br</b>. O administrador tem acesso total.</div>
          </form>
        </Card>
        <Card className="table-card">
          <div className="table-top"><h2>Usuários cadastrados</h2></div>
          <table className="data-table">
            <thead><tr><th>Usuário</th><th>E-mail</th><th>Cargo</th><th>Permissões</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id}><td><b>{user.name}</b></td><td>{user.email}</td><td>{user.role}</td><td><Badge tone="green">{user.permissions.includes("acesso_total") ? "ACESSO TOTAL" : `${user.permissions.length} módulos`}</Badge></td><td><Badge tone="purple">{user.status.toUpperCase()}</Badge></td><td className="action-cell"><Button variant="dark">Editar</Button><Button variant="danger">Excluir</Button></td></tr>)}</tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
