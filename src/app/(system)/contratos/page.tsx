"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

const contracts: Array<{ id: string; event: string; client: string; status: string; date: string }> = [];

export default function ContratosPage() {
  return (
    <div>
      <PageHeader eyebrow="DOCUMENTOS COMERCIAIS" title="Contratos" description="Central de contratos vinculados a eventos, orçamentos e arquivos do servidor. Nenhum contrato vem pré-cadastrado." actions={<Button>Novo contrato</Button>} />
      <div className="grid grid-3"><MetricCard label="Contratos" value={contracts.length} /><MetricCard label="Assinados" value={0} tone="green" /><MetricCard label="Pendentes" value={0} tone="yellow" /></div>
      <Card className="filters" style={{ marginTop: 22 }}><div className="filter-grid"><Field label="Cliente"><TextInput placeholder="Buscar cliente" /></Field><Field label="Status"><SelectInput><option>Todos</option><option>Assinado</option><option>Em elaboração</option></SelectInput></Field><Field label="Data"><TextInput type="date" /></Field><Button>Filtrar</Button></div></Card>
      <Card className="table-card" style={{ marginTop: 22 }}>
        <div className="table-top"><h2>Lista de contratos</h2><Button>Enviar contrato ao servidor</Button></div>
        <table className="data-table"><thead><tr><th>Evento</th><th>Cliente</th><th>Data</th><th>Status</th><th>Arquivo</th><th>Ações</th></tr></thead><tbody><tr><td colSpan={6}><p className="muted">Nenhum contrato cadastrado ainda.</p></td></tr></tbody></table>
      </Card>
    </div>
  );
}
