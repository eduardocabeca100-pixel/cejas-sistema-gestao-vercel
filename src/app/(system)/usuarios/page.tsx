"use client";

import { useEffect, useState } from "react";
import type { AppUser } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Form";
import { PageHeader } from "@/components/ui/PageHeader";
import { APP_MODULES } from "@/lib/modules";

const permissionOptions = APP_MODULES.filter((module) => !module.alwaysVisible && !module.superadminOnly).map((module) => module.permissionLabel);

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [formKey, setFormKey] = useState(0);

  function carregarUsuarios() {
    fetch("/api/usuarios", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setUsers).catch(() => setUsers([]));
  }

  useEffect(() => { carregarUsuarios(); }, []);

  function togglePermission(value: string) {
    setPermissions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");

    setSalvando(true);
    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          id: editingId,
          name: String(form.get("name")),
          role: String(form.get("role")),
          status: String(form.get("status")),
          permissions
        };
        if (password) payload.password = password;
        const response = await fetch("/api/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const json = await response.json();
        if (!json.ok) { setErro(json.error); return; }
      } else {
        const payload = {
          name: String(form.get("name")),
          email: String(form.get("email")),
          role: String(form.get("role")),
          status: String(form.get("status")),
          password,
          permissions
        };
        const response = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const json = await response.json();
        if (!json.ok) { setErro(json.error); return; }
      }

      setEditingId(null);
      setPermissions([]);
      setFormKey((key) => key + 1);
      carregarUsuarios();
    } catch {
      setErro("Erro de conexão ao salvar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  function editarUsuario(user: AppUser) {
    setEditingId(user.id);
    setPermissions(user.permissions || []);
    setFormKey((key) => key + 1);
  }

  function cancelarEdicao() {
    setEditingId(null);
    setPermissions([]);
    setFormKey((key) => key + 1);
  }

  async function excluirUsuario(user: AppUser) {
    if (!window.confirm(`Excluir o usuário ${user.name}? Essa ação não pode ser desfeita.`)) return;
    const response = await fetch(`/api/usuarios?id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
    const json = await response.json();
    if (!json.ok) return alert(json.error);
    carregarUsuarios();
  }

  const usuarioEmEdicao = editingId ? users.find((u) => u.id === editingId) : null;

  return (
    <div>
      <PageHeader eyebrow="CONTROLE DE ACESSO" title="Acessos / Usuários" description="Crie usuários institucionais e escolha mais de uma permissão para cada pessoa." actions={<Button onClick={() => { window.location.href = "/dashboard"; }}>Voltar ao painel</Button>} />
      <div className="grid grid-2">
        <Card className="pad">
          <h2>{editingId ? `Editar usuário — ${usuarioEmEdicao?.name || ""}` : "Novo usuário"}</h2>
          <form className="grid" onSubmit={saveUser} key={formKey}>
            <Field label="Nome"><TextInput name="name" placeholder="Nome completo" defaultValue={usuarioEmEdicao?.name} required /></Field>
            <Field label="E-mail institucional"><TextInput name="email" placeholder="nome@cejas.com.br" type="email" defaultValue={usuarioEmEdicao?.email} disabled={Boolean(editingId)} required /></Field>
            <Field label="Tipo"><SelectInput name="role" defaultValue={usuarioEmEdicao?.role || "Leitura"}><option>Administrador</option><option>Financeiro</option><option>Comercial</option><option>Operacional</option><option>Leitura</option><option>Superadmin</option></SelectInput></Field>
            <Field label="Status"><SelectInput name="status" defaultValue={usuarioEmEdicao?.status || "ativo"}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></SelectInput></Field>
            <Field label={editingId ? "Nova senha (deixe em branco para manter)" : "Senha inicial"}><TextInput name="password" type="password" placeholder="Mínimo 6 caracteres" /></Field>
            <div>
              <span className="kicker">Permissões</span>
              <div className="radio-stack">
                {permissionOptions.map((option) => <label key={option}><input type="checkbox" checked={permissions.includes(option)} onChange={() => togglePermission(option)} /> {option.toUpperCase()}</label>)}
              </div>
            </div>
            {erro && <div className="login-note" style={{ color: "#f87171" }}>{erro}</div>}
            <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar usuário"}</Button>
            {editingId && <Button type="button" variant="dark" onClick={cancelarEdicao}>Cancelar edição</Button>}
            <div className="sidebar-help" style={{ marginTop: 0 }}><strong>Regra:</strong> só é permitido cadastrar usuários com e-mail institucional <b>@cejas.com.br</b>. O administrador tem acesso total.</div>
          </form>
        </Card>
        <Card className="table-card">
          <div className="table-top"><h2>Usuários cadastrados</h2></div>
          <table className="data-table">
            <thead><tr><th>Usuário</th><th>E-mail</th><th>Cargo</th><th>Permissões</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id}><td><b>{user.name}</b></td><td>{user.email}</td><td>{user.role}</td><td><Badge tone="green">{user.permissions.includes("*") ? "ACESSO TOTAL" : `${user.permissions.length} módulos`}</Badge></td><td><Badge tone="purple">{user.status.toUpperCase()}</Badge></td><td className="action-cell"><Button variant="dark" onClick={() => editarUsuario(user)}>Editar</Button><Button variant="danger" onClick={() => excluirUsuario(user)}>Excluir</Button></td></tr>)}</tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
