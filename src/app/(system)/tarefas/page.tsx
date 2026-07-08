"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("Geral");
  const [notes, setNotes] = useState("");
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    fetch("/api/tarefas", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).then(setTasks).catch(() => setTasks([]));
  }

  useEffect(() => { carregar(); }, []);

  async function criarTarefa() {
    if (!title.trim()) return;
    setSalvando(true);
    try {
      const response = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, module, description: notes, priority: "média", status: "pendente" })
      });
      const json = await response.json();
      if (!json.ok) return alert(json.error);
      setTitle("");
      setNotes("");
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(task: Task, status: string) {
    const response = await fetch("/api/tarefas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: task.id, status }) });
    const json = await response.json();
    if (!json.ok) return alert(json.error);
    carregar();
  }

  async function excluirTarefa(task: Task) {
    const response = await fetch(`/api/tarefas?id=${encodeURIComponent(task.id)}`, { method: "DELETE" });
    const json = await response.json();
    if (!json.ok) return alert(json.error);
    carregar();
  }

  return (
    <div>
      <PageHeader eyebrow="ROTINA ADMINISTRATIVA" title="Tarefas Pendentes" description="Lista para criar tarefas prioritárias por módulo, responsável, prazo e status." actions={<Button onClick={criarTarefa} disabled={salvando}>{salvando ? "Criando..." : "Criar tarefa"}</Button>} />
      <div className="grid grid-4">
        <MetricCard label="Pendentes" value={tasks.filter((task) => task.status === "pendente").length} tone="yellow" />
        <MetricCard label="Em andamento" value={tasks.filter((task) => task.status === "andamento").length} tone="purple" />
        <MetricCard label="Concluídas" value={tasks.filter((task) => task.status === "concluida").length} tone="green" />
        <MetricCard label="Total" value={tasks.length} />
      </div>
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <Card className="pad">
          <h2>Nova tarefa</h2>
          <div className="grid">
            <Field label="Título"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Descreva a tarefa" /></Field>
            <Field label="Módulo"><SelectInput value={module} onChange={(event) => setModule(event.target.value)}><option>Geral</option><option>Financeiro</option><option>Agenda</option><option>Servidor</option></SelectInput></Field>
            <Field label="Observações"><TextArea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Detalhes da tarefa..." /></Field>
          </div>
        </Card>
        <Card className="pad">
          <h2>Lista de tarefas</h2>
          {tasks.length === 0 && <p className="muted">Nenhuma tarefa cadastrada ainda.</p>}
          {tasks.map((task) => (
            <article className="file-row" key={task.id}>
              <div><b>{task.title}</b><br /><span className="muted">{task.module} {task.dueDate ? `• ${task.dueDate}` : ""}</span></div>
              <Badge tone={task.priority === "alta" ? "red" : task.priority === "média" ? "yellow" : "neutral"}>{task.priority}</Badge>
              <div className="action-cell">
                {task.status !== "concluida" && <Button variant="dark" onClick={() => alterarStatus(task, task.status === "andamento" ? "concluida" : "andamento")}>{task.status === "andamento" ? "Concluir" : "Iniciar"}</Button>}
                <Button variant="danger" onClick={() => excluirTarefa(task)}>Excluir</Button>
              </div>
            </article>
          ))}
        </Card>
      </div>
    </div>
  );
}
