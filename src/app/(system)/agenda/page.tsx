"use client";

import { useEffect, useMemo, useState } from "react";
import type { CejasEvent, EventStatus } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/format/currency";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function toIso(year: number, monthIndex: number, day: number) {
  const date = new Date(year, monthIndex, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthGrid(year: number, monthIndex: number) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < startOffset; i++) {
    const day = new Date(year, monthIndex, 1 - (startOffset - i));
    cells.push({ iso: toIso(day.getFullYear(), day.getMonth(), day.getDate()), day: day.getDate(), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toIso(year, monthIndex, day), day, inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const nextDate = new Date(`${last.iso}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);
    cells.push({ iso: toIso(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate()), day: nextDate.getDate(), inMonth: false });
    if (cells.length >= 42) break;
  }
  return cells;
}

export default function AgendaPage() {
  const today = new Date();
  const [events, setEvents] = useState<CejasEvent[]>([]);
  const [status, setStatus] = useState("todos");
  const [room, setRoom] = useState("todas");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toIso(today.getFullYear(), today.getMonth(), today.getDate()));
  const [showForm, setShowForm] = useState(false);
  const [salvandoStatus, setSalvandoStatus] = useState<string | null>(null);

  function carregarEventos() {
    fetch("/api/events", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setEvents).catch(() => {});
  }

  useEffect(() => {
    carregarEventos();
    const interval = setInterval(carregarEventos, 8000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(
    () => events
      .filter((event) => (status === "todos" || event.status === status) && (room === "todas" || event.room === room))
      .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date))),
    [events, status, room]
  );
  const selectedEvents = filtered.filter((event) => event.date === selectedDate);
  const confirmed = filtered.filter((event) => event.status === "confirmado");
  const pending = filtered.filter((event) => event.status === "em_espera");
  const canceled = filtered.filter((event) => event.status === "cancelado");
  const rooms = Array.from(new Set(events.map((event) => event.room).filter(Boolean)));
  const monthGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function irParaMesAnterior() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else { setMonth((m) => m - 1); }
  }
  function irParaProximoMes() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else { setMonth((m) => m + 1); }
  }
  function irParaHoje() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(toIso(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  async function addManualEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
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
      status: String(form.get("status"))
    };
    const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await response.json();
    if (!json.ok) { alert(json.error); return; }
    setShowForm(false);
    carregarEventos();
  }

  async function alterarStatus(eventId: string, novoStatus: EventStatus) {
    setSalvandoStatus(eventId);
    try {
      const response = await fetch("/api/events", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: eventId, status: novoStatus }) });
      const json = await response.json();
      if (!json.ok) { alert(json.error); return; }
      carregarEventos();
    } finally {
      setSalvandoStatus(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="AGENDA OPERACIONAL"
        title="Agenda Dinâmica"
        description="Calendário completo de eventos, salas e status. Qualquer usuário pode confirmar, colocar em espera ou cancelar — atualiza para todos automaticamente."
        actions={<><Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Fechar cadastro" : "Criar evento manual"}</Button><Button variant="dark" onClick={carregarEventos}>Atualizar</Button></>}
      />

      <Card className="filters">
        <div className="filter-grid">
          <Field label="Status"><SelectInput value={status} onChange={(event) => setStatus(event.target.value)}><option value="todos">Todos</option><option value="confirmado">Confirmados</option><option value="em_espera">Em espera</option><option value="cancelado">Cancelados</option></SelectInput></Field>
          <Field label="Sala"><SelectInput value={room} onChange={(event) => setRoom(event.target.value)}><option value="todas">Todas as salas</option>{rooms.map((item) => <option key={item}>{item}</option>)}</SelectInput></Field>
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
          <div className="calendar-header"><h2>{monthNames[month]} de {year}</h2><div className="calendar-controls"><Button variant="ghost" onClick={irParaMesAnterior}>‹</Button><Button variant="dark" onClick={irParaHoje}>Hoje</Button><Button variant="ghost" onClick={irParaProximoMes}>›</Button></div></div>
          <div className="month-grid">
            {weekdays.map((day) => <div className="weekday" key={day}>{day}</div>)}
            {monthGrid.map((cell) => {
              const items = filtered.filter((event) => event.date === cell.iso);
              return (
                <div className={`day-cell ${cell.iso === selectedDate ? "active" : ""}`} key={cell.iso} style={{ opacity: cell.inMonth ? 1 : 0.4 }} onClick={() => setSelectedDate(cell.iso)}>
                  <div className="day-number">{cell.day}</div>
                  <div className="day-events">
                    {items.map((event) => <span key={event.id} className={`event-pill ${event.status}`} title={event.title}>{event.title}</span>)}
                  </div>
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
          {selectedEvents.length === 0 && <p className="muted" style={{ marginTop: 16 }}>Nenhum evento nesta data.</p>}
          {selectedEvents.map((event) => (
            <article
              className="event-detail-card"
              key={event.id}
              style={{ borderLeftColor: event.status === "confirmado" ? "var(--green)" : event.status === "cancelado" ? "var(--red)" : "var(--purple)" }}
            >
              <h3>{event.title}</h3>
              <p className="event-room">{event.startTime}–{event.endTime} · {event.room}</p>
              <div className="status-dots">
                <button type="button" title="Confirmar" className={`dot-green ${event.status === "confirmado" ? "active" : ""}`} disabled={salvandoStatus === event.id} onClick={() => alterarStatus(event.id, "confirmado")} />
                <button type="button" title="Colocar em espera" className={`dot-purple ${event.status === "em_espera" ? "active" : ""}`} disabled={salvandoStatus === event.id} onClick={() => alterarStatus(event.id, "em_espera")} />
                <button type="button" title="Cancelar" className={`dot-red ${event.status === "cancelado" ? "active" : ""}`} disabled={salvandoStatus === event.id} onClick={() => alterarStatus(event.id, "cancelado")} />
              </div>
            </article>
          ))}
        </Card>
      </div>
    </div>
  );
}
