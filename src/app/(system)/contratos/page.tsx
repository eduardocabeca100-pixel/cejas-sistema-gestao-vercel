"use client";

import { useEffect, useState } from "react";
import type { Contract } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    fetch("/api/contratos", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).then(setContracts).catch(() => setContracts([]));
  }

  useEffect(() => { carregar(); }, []);

  const assinados = contracts.filter((c) => c.status === "Assinado").length;
  const pendentes = contracts.filter((c) => c.status !== "Assinado").length;

  async function criarContrato(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { client: String(form.get("client")), title: String(form.get("title")), status: String(form.get("status")) };
    setSalvando(true);
    try {
      const response = await fetch("/api/contratos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await response.json();
      if (!json.ok) return alert(json.error);
      setFormAberto(false);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(contract: Contract, status: string) {
    const response = await fetch("/api/contratos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: contract.id, status }) });
    const json = await response.json();
    if (!json.ok) return alert(json.error);
    carregar();
  }

  return (
    <div>
      <PageHeader eyebrow="DOCUMENTOS COMERCIAIS" title="Contratos" description="Central de contratos vinculados a eventos, orçamentos e arquivos do servidor." actions={<Button onClick={() => setFormAberto((v) => !v)}>{formAberto ? "Fechar" : "Novo contrato"}</Button>} />
      <div className="grid grid-3"><MetricCard label="Contratos" value={contracts.length} /><MetricCard label="Assinados" value={assinados} tone="green" /><MetricCard label="Pendentes" value={pendentes} tone="yellow" /></div>

      {formAberto && (
        <Card className="pad" style={{ marginTop: 22 }}>
          <h2>Novo contrato</h2>
          <form className="grid grid-3" onSubmit={criarContrato}>
            <Field label="Cliente"><TextInput name="client" placeholder="Nome do cliente" required /></Field>
            <Field label="Título / Evento"><TextInput name="title" placeholder="Título do contrato" required /></Field>
            <Field label="Status"><SelectInput name="status" defaultValue="Em elaboração"><option>Em elaboração</option><option>Assinado</option><option>Cancelado</option></SelectInput></Field>
            <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar contrato"}</Button>
          </form>
        </Card>
      )}

      <Card className="filters" style={{ marginTop: 22 }}><div className="filter-grid"><Field label="Cliente"><TextInput placeholder="Buscar cliente" /></Field><Field label="Status"><SelectInput><option>Todos</option><option>Assinado</option><option>Em elaboração</option></SelectInput></Field><Field label="Data"><TextInput type="date" /></Field></div></Card>
      <Card className="table-card" style={{ marginTop: 22 }}>
        <div className="table-top"><h2>Lista de contratos</h2></div>
        <table className="data-table">
          <thead><tr><th>Título</th><th>Cliente</th><th>Criado em</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {!contracts.length && <tr><td colSpan={5}><p className="muted">Nenhum contrato cadastrado ainda.</p></td></tr>}
            {contracts.map((contract) => (
              <tr key={contract.id}>
                <td><b>{contract.title}</b></td>
                <td>{contract.client}</td>
                <td>{new Date(contract.createdAt).toLocaleDateString("pt-BR")}</td>
                <td><Badge tone={contract.status === "Assinado" ? "green" : "yellow"}>{contract.status.toUpperCase()}</Badge></td>
                <td className="action-cell">
                  {contract.status !== "Assinado" && <Button variant="dark" onClick={() => alterarStatus(contract, "Assinado")}>Marcar assinado</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
