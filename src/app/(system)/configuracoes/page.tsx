"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Form";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = ["Identidade", "Dados CEJAS", "Orçamentos", "Comercial", "Checklist", "Painel do Dia", "Usuários", "Segurança"];

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState("Identidade");

  return (
    <div>
      <PageHeader eyebrow="CONFIGURAÇÕES 2.0" title="Centro de Controle" description="Personalize identidade visual, dados do CEJAS, padrões dos orçamentos, comercial, checklist, painel do dia, usuários e segurança." actions={<><Button variant="dark">Voltar ao Painel</Button><Button>Salvar configurações</Button></>} />
      <div className="badge badge-green" style={{ marginBottom: 18 }}>● Somente Superadmin pode alterar estas configurações</div>
      <Card className="tabs">{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</Card>
      {tab === "Identidade" && <div className="grid grid-2"><Card className="pad"><h2>Identidade visual</h2><Field label="Nome do sistema"><TextInput placeholder="Sistema de Gestão CEJAS" /></Field><Field label="Subtítulo"><TextInput placeholder="Painel Administrativo" /></Field><div className="grid grid-3"><Field label="Cor principal"><div className="color-swatch color-purple" /></Field><Field label="Cor secundária"><div className="color-swatch color-magenta" /></Field><Field label="Cor dos botões"><div className="color-swatch color-blue" /></Field></div><Field label="Rodapé do sistema"><TextInput placeholder="Rodapé do sistema" /></Field></Card><Card className="pad"><h2>Logo, favicon e assinatura</h2><Field label="Logo do sistema"><TextInput type="file" /></Field><Field label="Favicon"><TextInput type="file" /></Field><Field label="Assinatura dos orçamentos"><TextInput type="file" /></Field></Card></div>}
      {tab === "Dados CEJAS" && <Card className="pad"><h2>Dados gerais do sistema</h2><div className="grid grid-2"><Field label="Razão social"><TextInput placeholder="Razão social" /></Field><Field label="CNPJ"><TextInput placeholder="CNPJ" /></Field><Field label="Endereço"><TextInput placeholder="Endereço" /></Field><Field label="Cidade"><TextInput placeholder="Cidade / UF" /></Field></div></Card>}
      {tab === "Orçamentos" && <Card className="pad"><h2>Parâmetros de orçamento</h2><div className="grid grid-2"><Field label="Validade padrão"><SelectInput><option>72 horas</option><option>7 dias</option></SelectInput></Field><Field label="Horário limite do prédio"><TextInput placeholder="22:00" /></Field></div><Field label="Condições comerciais"><TextArea placeholder="Condições comerciais padrão" /></Field><h3>Rubricas</h3><div className="file-card-list"><p className="muted">Nenhuma rubrica cadastrada ainda.</p></div></Card>}
      {!['Identidade','Dados CEJAS','Orçamentos'].includes(tab) && <Card className="pad"><h2>{tab}</h2><p className="muted">Área preparada para parâmetros administrativos, regras gerais, preferências e segurança. Os dados devem ser persistidos na tabela settings do Supabase.</p><Field label="Configuração"><TextArea placeholder="Insira regras e parâmetros..." /></Field></Card>}
    </div>
  );
}
