"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Form";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = ["Identidade", "Dados CEJAS", "Orçamentos", "Comercial", "Checklist", "Painel do Dia", "Usuários", "Segurança"];

const tabToKey: Record<string, string> = {
  "Identidade": "identidade",
  "Dados CEJAS": "dados_cejas",
  "Orçamentos": "orcamentos_params",
  "Comercial": "comercial",
  "Checklist": "checklist",
  "Painel do Dia": "painel_do_dia",
  "Segurança": "seguranca"
};

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState("Identidade");
  const [valores, setValores] = useState<Record<string, Record<string, string>>>({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const key = tabToKey[tab];
  const atual = valores[key] || {};

  useEffect(() => {
    if (!key) return;
    fetch(`/api/configuracoes?key=${key}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setValores((current) => ({ ...current, [key]: data })); })
      .catch(() => {});
  }, [key]);

  function setCampo(campo: string, valor: string) {
    setValores((current) => ({ ...current, [key]: { ...current[key], [campo]: valor } }));
  }

  async function salvar() {
    if (!key) return;
    setSalvando(true);
    setMensagem("");
    try {
      const response = await fetch("/api/configuracoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value: atual }) });
      const json = await response.json();
      if (!json.ok) { setMensagem(json.error); return; }
      setMensagem("Configurações salvas no Supabase.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="CONFIGURAÇÕES 2.0" title="Centro de Controle" description="Personalize identidade visual, dados do CEJAS, padrões dos orçamentos, comercial, checklist, painel do dia, usuários e segurança." actions={<Button onClick={salvar} disabled={salvando || tab === "Usuários"}>{salvando ? "Salvando..." : "Salvar configurações"}</Button>} />
      <div className="badge badge-green" style={{ marginBottom: 18 }}>● Somente Superadmin pode alterar estas configurações</div>
      {mensagem && <p className="muted" style={{ marginBottom: 12 }}>{mensagem}</p>}
      <Card className="tabs">{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</Card>

      {tab === "Identidade" && (
        <div className="grid grid-2">
          <Card className="pad">
            <h2>Identidade visual</h2>
            <Field label="Nome do sistema"><TextInput value={atual.systemName || ""} onChange={(e) => setCampo("systemName", e.target.value)} placeholder="Sistema de Gestão CEJAS" /></Field>
            <Field label="Subtítulo"><TextInput value={atual.subtitle || ""} onChange={(e) => setCampo("subtitle", e.target.value)} placeholder="Painel Administrativo" /></Field>
            <Field label="Rodapé do sistema"><TextInput value={atual.footer || ""} onChange={(e) => setCampo("footer", e.target.value)} placeholder="Rodapé do sistema" /></Field>
          </Card>
          <Card className="pad"><h2>Logo, favicon e assinatura</h2><p className="muted">Envie os arquivos pelo módulo Servidor e cole o caminho aqui.</p><Field label="Caminho do logo"><TextInput value={atual.logoPath || ""} onChange={(e) => setCampo("logoPath", e.target.value)} /></Field></Card>
        </div>
      )}

      {tab === "Dados CEJAS" && (
        <Card className="pad">
          <h2>Dados gerais do sistema</h2>
          <div className="grid grid-2">
            <Field label="Razão social"><TextInput value={atual.razaoSocial || ""} onChange={(e) => setCampo("razaoSocial", e.target.value)} /></Field>
            <Field label="CNPJ"><TextInput value={atual.cnpj || ""} onChange={(e) => setCampo("cnpj", e.target.value)} /></Field>
            <Field label="Endereço"><TextInput value={atual.endereco || ""} onChange={(e) => setCampo("endereco", e.target.value)} /></Field>
            <Field label="Cidade"><TextInput value={atual.cidade || ""} onChange={(e) => setCampo("cidade", e.target.value)} /></Field>
          </div>
        </Card>
      )}

      {tab === "Orçamentos" && (
        <Card className="pad">
          <h2>Parâmetros de orçamento</h2>
          <div className="grid grid-2">
            <Field label="Validade padrão"><SelectInput value={atual.validade || "72 horas"} onChange={(e) => setCampo("validade", e.target.value)}><option>72 horas</option><option>7 dias</option></SelectInput></Field>
            <Field label="Horário limite do prédio"><TextInput value={atual.horarioLimite || ""} onChange={(e) => setCampo("horarioLimite", e.target.value)} placeholder="22:00" /></Field>
          </div>
          <Field label="Condições comerciais"><TextArea value={atual.condicoes || ""} onChange={(e) => setCampo("condicoes", e.target.value)} placeholder="Condições comerciais padrão" /></Field>
        </Card>
      )}

      {tab === "Usuários" && (
        <Card className="pad">
          <h2>Usuários</h2>
          <p className="muted">O cadastro de logins e senhas de outras pessoas é feito na tela de Acessos / Usuários.</p>
          <Link href="/usuarios"><Button>Ir para Acessos / Usuários</Button></Link>
        </Card>
      )}

      {!["Identidade", "Dados CEJAS", "Orçamentos", "Usuários"].includes(tab) && (
        <Card className="pad">
          <h2>{tab}</h2>
          <Field label="Configuração livre"><TextArea value={atual.texto || ""} onChange={(e) => setCampo("texto", e.target.value)} placeholder="Insira regras e parâmetros..." /></Field>
        </Card>
      )}
    </div>
  );
}
