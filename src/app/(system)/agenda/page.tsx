"use client";

import { useEffect, useMemo, useState } from "react";
import type { CejasEvent, EventStatus } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/format/currency";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const days = [28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,1];

function dayToIso(day: number, index: number) {
  if (index < 3) return `2026-06-${String(day).padStart(2, "0")}`;
  if (index > 33) return `2026-08-${String(day).padStart(2, "0")}`;
  return `2026-07-${String(day).padStart(2, "0")}`;
}

export default function AgendaPage() {
  const [events, setEvents] = useState<CejasEvent[]>([]);
  const [status, setStatus] = useState("todos");
  const [room, setRoom] = useState("todas");
  const [selectedDate, setSelectedDate] = useState("2026-07-02");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/events", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setEvents).catch(() => setEvents([]));
  }, []);

  const filtered = useMemo(() => events.filter((event) => (status === "todos" || event.status === status) && (room === "todas" || event.room === room)), [events, status, room]);
  const selectedEvents = filtered.filter((event) => event.date === selectedDate);
  const confirmed = filtered.filter((event) => event.status === "confirmado");
  const pending = filtered.filter((event) => event.status === "em_espera");
  const canceled = filtered.filter((event) => event.status === "cancelado");
  const rooms = Array.from(new Set(events.map((event) => event.room)));

  async function addManualEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: CejasEvent = {
      id: `evt-${Date.now()}`,
      date: String(form.get("date")),
      startTime: String(form.get("startTime")),
      endTime: String(form.get("endTime")),
      title: String(form.get("title")),
      company: String(form.get("company")),
      room: String(form.get("room")),
      origin: "Manual",
      participants: Number(form.get("participants") || 0),
      responsible: "Eduardo",
      amount: Number(form.get("amount") || 0),
      status: String(form.get("status")) as EventStatus
    };
    setEvents((current) => [payload, ...current]);
    await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => null);
    setShowForm(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="AGENDA OPERACIONAL"
        title="Agenda Dinâmica"
        description="Calendário completo de eventos, salas e status. Filtre por data, status, local/sala, empresa, evento ou responsável."
        actions={<><Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Fechar cadastro" : "Criar evento manual"}</Button><Button variant="dark">Atualizar</Button></>}
      />

      <Card className="filters">
        <div className="filter-grid">
          <Field label="Buscar"><TextInput placeholder="Empresa, sala, evento ou responsável" /></Field>
          <Field label="Status"><SelectInput value={status} onChange={(event) => setStatus(event.target.value)}><option value="todos">Todos</option><option value="confirmado">Confirmados</option><option value="em_espera">Em espera</option><option value="cancelado">Cancelados</option></SelectInput></Field>
          <Field label="Sala"><SelectInput value={room} onChange={(event) => setRoom(event.target.value)}><option value="todas">Todas as salas</option>{rooms.map((item) => <option key={item}>{item}</option>)}</SelectInput></Field>
          <Field label="Mês"><SelectInput><option>Julho de 2026</option></SelectInput></Field>
          <Field label="Origem"><SelectInput><option>Todos</option><option>Supera</option><option>Manual</option></SelectInput></Field>
        </div>
        <Button style={{ maxWidth: 760 }} onClick={() => { setStatus("todos"); setRoom("todas"); }}>Limpar filtros</Button>
      </Card>

      {showForm && (
        <Card className="pad" style={{ marginTop: 20 }}>
          <h2>Novo evento manual</h2>
          <form className="filter-grid" onSubmit={addManualEvent}>
            <Field label="Data"><TextInput type="date" name="date" required /></Field>
            <Field label="Início"><TextInput type="time" name="startTime" required /></Field>
            <Field label="Fim"><TextInput type="time" name="endTime" required /></Field>
            <Field label="Sala"><TextInput name="room" placeholder="Ex: Auditório principal" required /></Field>
            <Field label="Status"><SelectInput name="status"><option value="confirmado">Confirmado</option><option value="em_espera">Em espera</option><option value="cancelado">Cancelado</option></SelectInput></Field>
            <Field label="Evento" className="grid-span-2"><TextInput name="title" placeholder="Nome do evento" required /></Field>
            <Field label="Empresa"><TextInput name="company" placeholder="Empresa" required /></Field>
            <Field label="Participantes"><TextInput type="number" name="participants" defaultValue="0" /></Field>
            <Field label="Valor"><TextInput type="number" name="amount" defaultValue="0" /></Field>
            <Button type="submit">Salvar evento</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-5" style={{ marginTop: 20 }}>
        <MetricCard label="Total de eventos" value={formatNumber(filtered.length)} />
        <MetricCard label="Confirmados" value={formatNumber(confirmed.length)} tone="green" />
        <MetricCard label="Em espera" value={formatNumber(pending.length)} tone="purple" />
        <MetricCard label="Cancelados" value={formatNumber(canceled.length)} tone="red" />
        <MetricCard label="Receita confirmada" value={formatCurrency(confirmed.reduce((s, e) => s + e.amount, 0))} />
      </div>

      <div className="calendar-layout" style={{ marginTop: 22 }}>
        <Card className="calendar-card">
          <div className="calendar-header"><h2>Julho De 2026</h2><div className="calendar-controls"><Button variant="ghost">‹</Button><Button variant="dark">Hoje</Button><Button variant="ghost">›</Button></div></div>
          <div className="month-grid">
            {weekdays.map((day) => <div className="weekday" key={day}>{day}</div>)}
            {days.map((day, index) => {
              const iso = dayToIso(day, index);
              const items = filtered.filter((event) => event.date === iso);
              return (
                <div className={`day-cell ${iso === selectedDate ? "active" : ""}`} key={`${day}-${index}`} onClick={() => setSelectedDate(iso)}>
                  <div className="day-number">{day}</div>
                  {items.slice(0,3).map((event) => <button key={event.id} className={`event-pill ${event.status}`}>{event.startTime} {event.room}</button>)}
                  {items.length > 3 && <small>+{items.length - 3} eventos</small>}
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="day-sidebar">
          <h2>Agenda do dia</h2>
          <p className="muted">{selectedDate.split("-").reverse().join("/")}</p>
          <div className="grid grid-3" style={{ gap: 10 }}>
            <MetricCard label="Eventos" value={selectedEvents.length} />
            <MetricCard label="Receita" value={formatCurrency(selectedEvents.reduce((s, e) => s + e.amount, 0))} />
            <MetricCard label="Pendentes" value={selectedEvents.filter((event) => event.status === "em_espera").length} />
          </div>
          {selectedEvents.map((event) => (
            <article className="event-detail-card" key={event.id}>
              <Badge tone={event.status === "confirmado" ? "green" : event.status === "cancelado" ? "red" : "purple"}>{event.status === "em_espera" ? "EM ESPERA" : event.status.toUpperCase()}</Badge>
              <h3>{event.title}</h3>
              <p><b>Horário:</b> {event.startTime} até {event.endTime}</p>
              <p><b>Sala:</b> {event.room}</p>
              <p><b>Empresa:</b> {event.company}</p>
              <p><b>Participantes:</b> {event.participants}</p>
              <p><b>Responsável:</b> {event.responsible}</p>
              <strong>{formatCurrency(event.amount)}</strong>
              <div className="status-dots"><span className="dot-green" /><span className="dot-purple" /><span className="dot-red" /></div>
            </article>
          ))}
        </Card>
      </div>
    </div>
  );
}
