"use client";

import { useEffect, useMemo, useState } from "react";
import type { CejasEvent } from "@/types";
import { formatCurrency } from "@/lib/format/currency";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Form";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PainelDoDiaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [events, setEvents] = useState<CejasEvent[]>([]);
  const [date, setDate] = useState(today);
  const [room, setRoom] = useState("todas");

  useEffect(() => {
    fetch("/api/events", { cache: "no-store" }).then((response) => response.ok ? response.json() : []).then(setEvents).catch(() => setEvents([]));
  }, []);

  const rooms = Array.from(new Set(events.map((event) => event.room).filter(Boolean)));
  const filtered = useMemo(() => events.filter((event) => event.date === date && (room === "todas" || event.room === room)), [events, date, room]);

  return (
    <div>
      <PageHeader eyebrow="OPERAÇÃO DO DIA" title="Painel do Dia" description="Tela limpa para acompanhar os eventos do dia, salas, horários e status depois que a agenda for alimentada." />
      <Card className="filters"><div className="filter-grid"><Field label="Data"><TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="Sala"><SelectInput value={room} onChange={(event) => setRoom(event.target.value)}><option value="todas">Todas as salas</option>{rooms.map((item) => <option key={item}>{item}</option>)}</SelectInput></Field></div></Card>
      <div className="grid grid-4" style={{ marginTop: 22 }}><MetricCard label="Eventos no dia" value={filtered.length} /><MetricCard label="Confirmados" value={filtered.filter((event) => event.status === "confirmado").length} tone="green" /><MetricCard label="Pendentes" value={filtered.filter((event) => event.status === "em_espera").length} tone="purple" /><MetricCard label="Receita do dia" value={formatCurrency(filtered.reduce((sum, event) => sum + event.amount, 0))} /></div>
      <div className="day-layout" style={{ marginTop: 22 }}>
        <Card className="event-list-card"><h2>Eventos filtrados</h2>{filtered.length === 0 && <p className="muted">Nenhum evento cadastrado para esta data.</p>}{filtered.map((event) => <article className={`operation-event ${event.status === "em_espera" ? "pending" : event.status === "cancelado" ? "cancelled" : ""}`} key={event.id}><Badge tone={event.status === "confirmado" ? "green" : event.status === "cancelado" ? "red" : "purple"}>{event.status}</Badge><h3>{event.title}</h3><p>{event.startTime} até {event.endTime} • {event.room}</p><p className="muted">{event.company}</p></article>)}</Card>
        <Card className="room-list"><h2>Salas do dia</h2><button className={`room-row ${room === "todas" ? "active" : ""}`} onClick={() => setRoom("todas")}><span>Todas</span><small>{filtered.length} evento(s)</small></button>{rooms.map((item) => <button key={item} className={`room-row ${room === item ? "active" : ""}`} onClick={() => setRoom(item)}><span>{item}</span><small>{events.filter((event) => event.room === item && event.date === date).length} evento(s)</small></button>)}</Card>
      </div>
    </div>
  );
}
