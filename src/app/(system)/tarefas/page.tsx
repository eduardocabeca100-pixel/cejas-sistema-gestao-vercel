"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

type Task = { id: string; title: string; module: string; priority: string; due: string; status: string };

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");

  return (
    <div>
      <PageHeader eyebrow="ROTINA ADMINISTRATIVA" title="Tarefas Pendentes" description="Lista limpa para criar tarefas prioritárias por módulo, responsável, prazo e status." actions={<Button onClick={() => title.trim() && setTasks((current) => [{ id: `tsk-${Date.now()}`, title, module: "Geral", priority: "média", due: "Hoje", status: "pendente" }, ...current])}>Criar tarefa</Button>} />
      <div className="grid grid-4"><MetricCard label="Pendentes" value={tasks.filter((task) => task.status === "pendente").length} tone="yellow" /><MetricCard label="Em andamento" value={tasks.filter((task) => task.status === "andamento").length} tone="purple" /><MetricCard label="Alta prioridade" value={tasks.filter((task) => task.priority === "alta").length} tone="red" /><MetricCard label="Total" value={tasks.length} /></div>
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <Card className="pad"><h2>Nova tarefa</h2><div className="grid"><Field label="Título"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Descreva a tarefa" /></Field><Field label="Módulo"><SelectInput><option>Geral</option><option>Financeiro</option><option>Agenda</option><option>Servidor</option></SelectInput></Field><Field label="Observações"><TextArea placeholder="Detalhes da tarefa..." /></Field></div></Card>
        <Card className="pad"><h2>Lista de tarefas</h2>{tasks.length === 0 && <p className="muted">Nenhuma tarefa cadastrada ainda.</p>}{tasks.map((task) => <article className="file-row" key={task.id}><div><b>{task.title}</b><br /><span className="muted">{task.module} • {task.due}</span></div><Badge tone={task.priority === "alta" ? "red" : task.priority === "média" ? "yellow" : "neutral"}>{task.priority}</Badge><Badge tone={task.status === "andamento" ? "purple" : "blue"}>{task.status}</Badge></article>)}</Card>
      </div>
    </div>
  );
}
