#!/usr/bin/env bash
set -euo pipefail
if [ ! -f package.json ] || [ ! -d src ]; then
  echo "ERRO: rode este script dentro da pasta cejas-sistema-gestao-vercel."
  exit 1
fi
python3 <<'PY'
from pathlib import Path
base=Path.cwd()

def w(rel, text):
    p=base/rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.strip()+"\n", encoding='utf-8')

w('src/lib/seed.ts', r'''
import type { AppUser, Budget, CejasEvent, DashboardSummary, FinanceEntry, Gratuity, ServerFile } from "@/types";

export const dashboardSeed: DashboardSummary = {
  totalEvents: 0,
  confirmedEvents: 0,
  pendingEvents: 0,
  canceledEvents: 0,
  expectedRevenue: 0,
  confirmedRevenue: 0,
  discountsApplied: 0,
  gratuitiesLoss: 0,
  cashBalance: 0,
  source: "Supabase Database • aguardando primeiro relatório/importação",
  updatedAt: new Date().toISOString(),
  monthlyRevenue: []
};

export const eventsSeed: CejasEvent[] = [];
export const budgetsSeed: Budget[] = [];
export const financeSeed: FinanceEntry[] = [];
export const gratuitiesSeed: Gratuity[] = [];
export const usersSeed: AppUser[] = [];
export const serverFilesSeed: ServerFile[] = [];
export const tasksSeed: Array<{ id: string; title: string; module: string; priority: string; due: string; status: string }> = [];
''')

w('src/lib/server/data.ts', r'''
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dashboardSeed } from "@/lib/seed";
import type { AppUser, Budget, CejasEvent, DashboardSummary, FinanceEntry, Gratuity, ServerFile } from "@/types";

function emptyDashboard(source = "Supabase Database • nenhum dado importado ainda"): DashboardSummary {
  return { ...dashboardSeed, source, updatedAt: new Date().toISOString() };
}

function monthLabel(dateValue?: string | null) {
  if (!dateValue) return "Sem data";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return emptyDashboard("Supabase não configurado • sem dados locais de fallback");

  const [{ data: events, error: eventsError }, { data: gratuities }, { data: finance }] = await Promise.all([
    supabase.from("events").select("date,status,amount,discount_value"),
    supabase.from("gratuities").select("loss_value"),
    supabase.from("finance_entries").select("amount,payment_status")
  ]);

  if (eventsError) return emptyDashboard(`Erro ao consultar Supabase: ${eventsError.message}`);

  const safeEvents = events || [];
  const totalEvents = safeEvents.length;
  const confirmedEvents = safeEvents.filter((event) => event.status === "confirmado").length;
  const pendingEvents = safeEvents.filter((event) => event.status === "em_espera").length;
  const canceledEvents = safeEvents.filter((event) => event.status === "cancelado").length;
  const expectedRevenue = safeEvents.reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const confirmedRevenue = safeEvents.filter((event) => event.status === "confirmado").reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const discountsApplied = safeEvents.reduce((sum, event) => sum + Number(event.discount_value || 0), 0);
  const gratuitiesLoss = (gratuities || []).reduce((sum, item) => sum + Number(item.loss_value || 0), 0);
  const cashBalance = (finance || []).filter((entry) => entry.payment_status === "Pago").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const revenueByMonth = new Map<string, number>();
  safeEvents
    .filter((event) => event.status === "confirmado")
    .forEach((event) => {
      const label = monthLabel(event.date);
      revenueByMonth.set(label, (revenueByMonth.get(label) || 0) + Number(event.amount || 0));
    });

  return {
    totalEvents,
    confirmedEvents,
    pendingEvents,
    canceledEvents,
    expectedRevenue,
    confirmedRevenue,
    discountsApplied,
    gratuitiesLoss,
    cashBalance,
    source: "Supabase Database",
    updatedAt: new Date().toISOString(),
    monthlyRevenue: Array.from(revenueByMonth, ([month, value]) => ({ month, value }))
  };
}

export async function getEvents(): Promise<CejasEvent[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true }).limit(1000);
  if (error || !data) return [];
  return data.map((event) => ({
    id: event.id,
    date: event.date,
    startTime: event.start_time || "",
    endTime: event.end_time || "",
    title: event.title,
    company: event.company || "",
    room: event.room || "",
    origin: event.origin || "Manual",
    participants: Number(event.participants || 0),
    responsible: event.responsible || "",
    amount: Number(event.amount || 0),
    status: event.status
  }));
}

export async function getBudgets(): Promise<Budget[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("budgets").select("*, budget_items(*)").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((budget) => ({
    id: budget.id,
    title: budget.title,
    company: budget.company,
    eventName: budget.event_name,
    issuer: budget.issuer,
    customerType: budget.customer_type,
    dayType: budget.day_type,
    notes: budget.notes || "",
    date: budget.event_date || "",
    startTime: budget.start_time || "",
    endTime: budget.end_time || "",
    items: (budget.budget_items || []).map((item: any) => ({ id: item.id, rubric: item.rubric, description: item.description, quantity: Number(item.quantity || 0), unitValue: Number(item.unit_value || 0), details: item.details || "" })),
    total: Number(budget.total || 0),
    status: budget.status
  }));
}

export async function getFinanceEntries(): Promise<FinanceEntry[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("finance_entries").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((entry) => ({
    id: entry.id,
    client: entry.client,
    date: entry.date || "",
    budgetLabel: entry.budget_label || "",
    boletoStatus: entry.boleto_status,
    demonstrativoStatus: entry.demonstrativo_status,
    paymentStatus: entry.payment_status,
    billingStatus: entry.billing_status,
    amount: Number(entry.amount || 0),
    filesCount: Number(entry.files_count || 0)
  }));
}

export async function getGratuities(): Promise<Gratuity[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("gratuities").select("*").order("date", { ascending: false });
  if (error || !data) return [];
  return data.map((gratuity) => ({
    id: gratuity.id,
    date: gratuity.date,
    event: gratuity.event,
    beneficiary: gratuity.beneficiary,
    type: gratuity.type,
    totalValue: Number(gratuity.total_value || 0),
    paidValue: Number(gratuity.paid_value || 0),
    lossValue: Number(gratuity.loss_value || 0),
    notes: gratuity.notes || "",
    responsible: gratuity.responsible || "",
    status: gratuity.status || "ativo"
  }));
}

export async function getServerFiles(): Promise<ServerFile[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("server_files").select("*").order("uploaded_at", { ascending: false }).limit(1000);
  if (error || !data) return [];
  return data.map((file) => ({
    id: file.id,
    name: file.name,
    path: file.path,
    size: Number(file.size || 0),
    mimeType: file.mime_type,
    year: file.year || "",
    month: file.month || "",
    eventName: file.event_name || "",
    fileType: file.file_type || "",
    uploadedAt: file.uploaded_at
  }));
}

export async function getUsers(): Promise<AppUser[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("app_users").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions || [], status: user.status }));
}
''')

w('src/app/api/import-report/route.ts', r'''
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, getStorageBucket } from "@/lib/supabase/admin";

async function tryExtractPdfText(buffer: Buffer) {
  try {
    const mod = (await import("pdf-parse")) as any;
    const pdfParse = mod.default || mod;
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  } catch {
    return "";
  }
}

function parseCurrency(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1].replace(/\./g, "").replace(",", ".")) || 0;
  }
  return 0;
}

function parseInteger(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1].replace(/\D/g, "")) || 0;
  }
  return 0;
}

function parseSummary(text: string) {
  return {
    total_events: parseInteger(text, [/total\s+de\s+eventos\D+(\d+)/i, /eventos\D+(\d+)/i]),
    confirmed_events: parseInteger(text, [/confirmad[oa]s?\D+(\d+)/i]),
    pending_events: parseInteger(text, [/em\s+espera\D+(\d+)/i, /pendentes?\D+(\d+)/i]),
    canceled_events: parseInteger(text, [/cancelad[oa]s?\D+(\d+)/i]),
    expected_revenue: parseCurrency(text, [/faturamento\s+previsto\D+([\d.]+,\d{2})/i]),
    confirmed_revenue: parseCurrency(text, [/receita\s+confirmada\D+([\d.]+,\d{2})/i]),
    discounts_applied: parseCurrency(text, [/descontos?\s+aplicados?\D+([\d.]+,\d{2})/i])
  };
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Envie um PDF." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva dados localmente." }, { status: 503 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await tryExtractPdfText(buffer);
  const parsed = parseSummary(text);
  const summary = { ...parsed, original_filename: file.name, extracted_text_preview: text.slice(0, 4000) };
  const storagePath = `relatorios/${new Date().getFullYear()}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage.from(getStorageBucket()).upload(storagePath, buffer, { contentType: file.type || "application/pdf", upsert: true });
  if (uploadError) return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });

  const { data: report, error: reportError } = await supabase.from("reports").insert({ ...summary, storage_path: storagePath, processed_at: new Date().toISOString() }).select().single();
  if (reportError || !report) return NextResponse.json({ ok: false, error: reportError?.message || "Erro ao salvar relatório." }, { status: 500 });

  return NextResponse.json({ ok: true, report, summary, imported: 0, message: "PDF salvo no Storage e resumo registrado. Nenhum evento mock foi criado." });
}
''')

# API POSTs should fail when Supabase is missing, not fake-save preview data.
for rel, text in {
'src/app/api/events/route.ts': r'''
import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() { return NextResponse.json(await getEvents()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva eventos localmente." }, { status: 503 });

  const { data, error } = await supabase.from("events").insert({
    date: body.date,
    start_time: body.startTime || null,
    end_time: body.endTime || null,
    title: body.title,
    company: body.company || null,
    room: body.room || null,
    origin: body.origin || "Manual",
    participants: body.participants || 0,
    responsible: body.responsible || "Eduardo",
    amount: body.amount || 0,
    discount_value: body.discountValue || 0,
    status: body.status || "em_espera"
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, event: data });
}
''',
'src/app/api/gratuidades/route.ts': r'''
import { NextRequest, NextResponse } from "next/server";
import { getGratuities } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() { return NextResponse.json(await getGratuities()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  const loss = Number(body.paidValue || 0) - Number(body.totalValue || 0);
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva gratuidades localmente." }, { status: 503 });

  const { data, error } = await supabase.from("gratuities").insert({
    date: body.date,
    event: body.event,
    beneficiary: body.beneficiary,
    type: body.type,
    total_value: body.totalValue,
    paid_value: body.paidValue,
    loss_value: loss,
    notes: body.notes,
    responsible: body.responsible || "Eduardo",
    status: body.status || "ativo"
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, gratuity: data });
}
''',
'src/app/api/orcamentos/route.ts': r'''
import { NextRequest, NextResponse } from "next/server";
import { getBudgets } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() { return NextResponse.json(await getBudgets()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva orçamentos localmente." }, { status: 503 });

  const { data: budget, error } = await supabase.from("budgets").insert({
    title: body.title,
    company: body.company,
    event_name: body.eventName,
    issuer: body.issuer,
    customer_type: body.customerType,
    day_type: body.dayType,
    notes: body.notes,
    event_date: body.date || null,
    start_time: body.startTime || null,
    end_time: body.endTime || null,
    total: body.total,
    status: body.status || "rascunho"
  }).select().single();

  if (error || !budget) return NextResponse.json({ ok: false, error: error?.message || "Erro ao salvar orçamento." }, { status: 500 });
  if (Array.isArray(body.items) && body.items.length) {
    await supabase.from("budget_items").insert(body.items.map((item: any) => ({
      budget_id: budget.id,
      rubric: item.rubric,
      description: item.description,
      quantity: item.quantity,
      unit_value: item.unitValue,
      details: item.details
    })));
  }
  return NextResponse.json({ ok: true, budget });
}
''',
'src/app/api/usuarios/route.ts': r'''
import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() { return NextResponse.json(await getUsers()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.email?.endsWith("@cejas.com.br")) return NextResponse.json({ ok: false, error: "Use e-mail institucional @cejas.com.br" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva usuários localmente." }, { status: 503 });

  const { data, error } = await supabase.from("app_users").insert({ name: body.name, email: body.email, role: body.role, permissions: body.permissions || [], status: body.status || "ativo" }).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, user: data });
}
''',
'src/app/api/storage/upload/route.ts': r'''
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, getStorageBucket } from "@/lib/supabase/admin";

function sanitizeSegment(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._ -]/g, "").trim().replace(/\s+/g, "_");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);
  const year = String(formData.get("year") || new Date().getFullYear());
  const month = String(formData.get("month") || `${new Date().getMonth() + 1}`.padStart(2, "0"));
  const eventName = sanitizeSegment(String(formData.get("eventName") || "GERAL"));
  const fileType = sanitizeSegment(String(formData.get("fileType") || "ARQUIVOS"));
  const mode = String(formData.get("mode") || "automatico");

  if (!files.length) return NextResponse.json({ ok: false, error: "Nenhum arquivo enviado." }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva arquivos localmente." }, { status: 503 });

  const uploaded = [];
  for (const file of files) {
    const originalPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const relativePath = originalPath.split("/").map(sanitizeSegment).filter(Boolean).join("/");
    const finalPath = mode === "pasta_original" ? `${year}/${relativePath}` : `${year}/${month}/${eventName}/${fileType}/${Date.now()}-${sanitizeSegment(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(getStorageBucket()).upload(finalPath, buffer, { contentType: file.type || "application/octet-stream", upsert: true });
    if (uploadError) return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });

    const { data, error } = await supabase.from("server_files").insert({ name: file.name, path: finalPath, size: file.size, mime_type: file.type || "application/octet-stream", year, month, event_name: eventName, file_type: fileType }).select().single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    uploaded.push(data);
  }
  return NextResponse.json({ ok: true, uploaded });
}
'''
}.items():
    w(rel,text)

w('src/components/dashboard/MiniCalendar.tsx', r'''
const days = [28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,1];
export function MiniCalendar() {
  return <div className="mini-calendar">{days.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>;
}
''')

# Make login clean: no default email/password.
p=base/'src/app/page.tsx'
s=p.read_text(encoding='utf-8')
s=s.replace('defaultValue="marcel@cejas.com.br" type="email"', 'placeholder="seuemail@cejas.com.br" type="email"')
s=s.replace('defaultValue="superadmin" type="password"', 'placeholder="Digite sua senha" type="password"')
p.write_text(s, encoding='utf-8')

# Basic regex replacements for imports/fallbacks.
repls = {
'src/app/(system)/dashboard/page.tsx': [
('RELATÓRIO OFICIAL CARREGADO DO SUPABASE','SISTEMA LIMPO • AGUARDANDO DADOS'),
('Dashboard de Resultados','Dashboard de Resultados'),
('dados restaurados no deploy','sem fallback local'),
('Dados reais do último PDF importado • Atualizado em','Sistema limpo • Atualizado em'),
('Valores calculados somente com eventos confirmados do relatório importado. Ao trocar o PDF, este painel atualiza junto.','Valores calculados somente a partir dos registros salvos no Supabase. Enquanto nenhum relatório for importado, o painel permanece zerado.'),
('julho de 2026','agenda limpa')
],
'src/app/(system)/agenda/page.tsx': [
('useState<CejasEvent[]>(eventsSeed)','useState<CejasEvent[]>([])'),
('fetch("/api/events", { cache: "no-store" }).then((r) => r.ok ? r.json() : eventsSeed).then(setEvents).catch(() => setEvents(eventsSeed));','fetch("/api/events", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setEvents).catch(() => setEvents([]));'),
('defaultValue="2026-07-02" required','required'),
('defaultValue="08:00" required','required'),
('defaultValue="17:00" required','required'),
('defaultValue="01 - Comércio Varejista" required','placeholder="Ex: Auditório principal" required'),
('formatNumber(filtered.length || 1355)','formatNumber(filtered.length)'),
('formatNumber(confirmed.length || 995)','formatNumber(confirmed.length)'),
('formatNumber(pending.length || 38)','formatNumber(pending.length)'),
('formatNumber(canceled.length || 322)','formatNumber(canceled.length)'),
('formatCurrency(confirmed.reduce((s, e) => s + e.amount, 0) || 320596)','formatCurrency(confirmed.reduce((s, e) => s + e.amount, 0))')
],
'src/app/(system)/financeiro/page.tsx': [
('useState<FinanceEntry[]>(financeSeed)','useState<FinanceEntry[]>([])'),
('fetch("/api/financeiro", { cache: "no-store" }).then((r) => r.ok ? r.json() : financeSeed).then(setEntries).catch(() => setEntries(financeSeed));','fetch("/api/financeiro", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setEntries).catch(() => setEntries([]));')
],
'src/app/(system)/servidor/page.tsx': [
('useState<ServerFile[]>(serverFilesSeed)','useState<ServerFile[]>([])'),
('fetch("/api/files", { cache: "no-store" }).then((r) => r.ok ? r.json() : serverFilesSeed).then(setFiles).catch(() => setFiles(serverFilesSeed));','fetch("/api/files", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setFiles).catch(() => setFiles([]));'),
('placeholder="Ex: SUPERA ENTIDADES" defaultValue="GERAL"','placeholder="Ex: Nome do evento ou entidade"')
],
'src/app/(system)/usuarios/page.tsx': [
('useState<AppUser[]>(usersSeed)','useState<AppUser[]>([])'),
('fetch("/api/usuarios", { cache: "no-store" }).then((r) => r.ok ? r.json() : usersSeed).then(setUsers).catch(() => setUsers(usersSeed));','fetch("/api/usuarios", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setUsers).catch(() => setUsers([]));')
],
'src/app/(system)/gratuidades/page.tsx': [
('useState<Gratuity[]>(gratuitiesSeed)','useState<Gratuity[]>([])'),
('fetch("/api/gratuidades", { cache: "no-store" }).then((r) => r.ok ? r.json() : gratuitiesSeed).then(setGratuities).catch(() => setGratuities(gratuitiesSeed));','fetch("/api/gratuidades", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setGratuities).catch(() => setGratuities([]));'),
('placeholder="Ex: FEMUSC"','placeholder="Nome do evento"')
],
}
for rel, pairs in repls.items():
    p=base/rel
    s=p.read_text(encoding='utf-8')
    # remove imports of seed arrays from pages where now unused
    s=s.replace('import { eventsSeed } from "@/lib/seed";\n','')
    s=s.replace('import { financeSeed } from "@/lib/seed";\n','')
    s=s.replace('import { serverFilesSeed } from "@/lib/seed";\n','')
    s=s.replace('import { usersSeed } from "@/lib/seed";\n','')
    s=s.replace('import { gratuitiesSeed } from "@/lib/seed";\n','')
    for a,b in pairs:
        s=s.replace(a,b)
    p.write_text(s, encoding='utf-8')

# Overwrite pages with problematic hard-coded data.
w('src/app/(system)/painel-do-dia/page.tsx', r'''
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
''')

w('src/app/(system)/orcamentos/page.tsx', r'''
"use client";

import { useMemo, useState } from "react";
import type { BudgetItem } from "@/types";
import { formatCurrency, parseCurrencyInput } from "@/lib/format/currency";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Form";

function newItem(): BudgetItem {
  return { id: `item-${Date.now()}`, rubric: "", description: "", quantity: 1, unitValue: 0, details: "" };
}

export default function OrcamentosPage() {
  const [company, setCompany] = useState("");
  const [eventName, setEventName] = useState("");
  const [issuer, setIssuer] = useState("EDUARDO");
  const [customerType, setCustomerType] = useState<"associado" | "nao_associado">("associado");
  const [dayType, setDayType] = useState<"dias_uteis" | "sabado" | "dom_fer">("dias_uteis");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([newItem()]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitValue, 0), [items]);

  function updateItem(id: string, patch: Partial<BudgetItem>) { setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  function removeItem(id: string) { setItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current); }

  async function saveBudget() {
    if (!company.trim() || !eventName.trim()) return alert("Informe cliente e evento antes de salvar.");
    const payload = { title: eventName, company, eventName, issuer, customerType, dayType, notes, date, startTime, endTime, items, total, status: "rascunho" };
    const response = await fetch("/api/orcamentos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await response.json();
    if (!json.ok) return alert(json.error || "Não foi possível salvar.");
    alert("Orçamento salvo no Supabase.");
  }

  return (
    <div className="budget-page">
      <div className="budget-topbar"><div><span className="eyebrow">ORÇAMENTOS CEJAS</span><h1>Orçamentos v.2026</h1></div><div className="budget-actions"><Button variant="dark" onClick={() => window.print()}>Gerar PDF</Button><Button onClick={saveBudget}>Salvar no Supabase</Button></div></div>
      <div className="budget-shell">
        <section className="budget-form">
          <h2>Dados do orçamento</h2>
          <div className="segmented"><button className={customerType === "associado" ? "active" : ""} onClick={() => setCustomerType("associado")}>Associado</button><button className={customerType === "nao_associado" ? "active" : ""} onClick={() => setCustomerType("nao_associado")}>Não associado</button><button className="green">Manual</button></div>
          <div className="segmented"><button className={dayType === "dias_uteis" ? "active" : ""} onClick={() => setDayType("dias_uteis")}>Dias úteis</button><button className={dayType === "sabado" ? "active" : ""} onClick={() => setDayType("sabado")}>Sábado</button><button className={dayType === "dom_fer" ? "active" : ""} onClick={() => setDayType("dom_fer")}>Dom./Fer.</button></div>
          <div className="grid grid-2"><Field label="Cliente / Empresa"><TextInput value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Nome do cliente" /></Field><Field label="Evento"><TextInput value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="Nome do evento" /></Field><Field label="Emissor"><TextInput value={issuer} onChange={(event) => setIssuer(event.target.value)} /></Field><Field label="Data"><TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="Início"><TextInput type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></Field><Field label="Fim"><TextInput type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></div>
          <h3 className="budget-section-title">Itens por rubrica</h3>
          {items.map((item) => <div className="budget-item-row" key={item.id}><TextInput placeholder="Rubrica" value={item.rubric} onChange={(event) => updateItem(item.id, { rubric: event.target.value })} /><TextInput type="number" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value || 0) })} /><TextInput placeholder="Descrição" value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} /><TextInput placeholder="Valor" value={item.unitValue || ""} onChange={(event) => updateItem(item.id, { unitValue: parseCurrencyInput(event.target.value) })} /><Button variant="danger" onClick={() => removeItem(item.id)}>×</Button></div>)}
          <Button variant="dark" onClick={() => setItems((current) => [...current, newItem()])}>Adicionar item</Button>
          <Field label="Observações"><TextArea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Condições comerciais, validade, observações internas..." /></Field>
        </section>
        <section className="paper">
          <div className="paper-head"><div><strong>CEJAS</strong><p>Centro Empresarial de Jaraguá do Sul</p></div><div className="paper-logo">LOGO</div></div>
          <div className="paper-title">ORÇAMENTO</div>
          <p><b>Cliente:</b> {company || "A preencher"}</p><p><b>Evento:</b> {eventName || "A preencher"}</p><p><b>Data:</b> {date ? date.split("-").reverse().join("/") : "A preencher"} • {startTime || "--:--"} até {endTime || "--:--"}</p>
          <table className="paper-table"><thead><tr><th>Rubrica</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.rubric || "-"}</td><td>{item.description || "-"}</td><td>{item.quantity}</td><td>{formatCurrency(item.unitValue)}</td><td>{formatCurrency(item.quantity * item.unitValue)}</td></tr>)}</tbody></table>
          <div className="total-box"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
          <div className="paper-conditions"><b>Condições:</b><p>{notes || "A preencher conforme negociação."}</p></div>
        </section>
      </div>
    </div>
  );
}
''')

w('src/app/(system)/contratos/page.tsx', r'''
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
''')

w('src/app/(system)/tarefas/page.tsx', r'''
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
''')

# Simplify importar-relatorio page clean; use zero summary no static detected rooms.
w('src/app/(system)/importar-relatorio/page.tsx', r'''
"use client";

import { useState } from "react";
import { dashboardSeed } from "@/lib/seed";
import { formatCurrency, formatNumber } from "@/lib/format/currency";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ImportarRelatorioPage() {
  const [summary, setSummary] = useState(dashboardSeed);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("Nenhum PDF importado ainda.");
  const [loading, setLoading] = useState(false);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setStatus("Enviando PDF para Supabase Storage...");
    try {
      const response = await fetch("/api/import-report", { method: "POST", body: form });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || "Erro ao importar PDF.");
      if (json.summary) setSummary({ ...dashboardSeed, totalEvents: json.summary.total_events, confirmedEvents: json.summary.confirmed_events, pendingEvents: json.summary.pending_events, canceledEvents: json.summary.canceled_events, expectedRevenue: json.summary.expected_revenue, confirmedRevenue: json.summary.confirmed_revenue, discountsApplied: json.summary.discounts_applied, source: "Supabase Database", updatedAt: new Date().toISOString() });
      setStatus(json.message || "PDF salvo no Storage e resumo registrado no banco.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao importar PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="IMPORTAÇÃO OFICIAL" title="Importar Relatório PDF" description="Envie o PDF do Supera. O arquivo original fica no Supabase Storage e o resumo no Supabase Database. Nenhum evento mock é criado." actions={<Button variant="dark">Ver histórico</Button>} />
      <div className="grid grid-4"><MetricCard label="Total de eventos" value={formatNumber(summary.totalEvents)} /><MetricCard label="Confirmados" value={formatNumber(summary.confirmedEvents)} tone="green" /><MetricCard label="Em espera" value={formatNumber(summary.pendingEvents)} tone="purple" /><MetricCard label="Cancelados" value={formatNumber(summary.canceledEvents)} tone="red" /></div>
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <Card className="pad"><h2>Upload do relatório</h2><form onSubmit={upload}><label className="upload-zone"><input name="file" type="file" accept="application/pdf" style={{ display: "none" }} onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} /><div><strong>📄 Arraste ou selecione o PDF do Supera</strong><p>{fileName || "Nenhum arquivo selecionado"}</p></div></label><div className="upload-actions"><Button type="submit">{loading ? "Importando..." : "Importar PDF"}</Button><Button type="button" variant="dark" onClick={() => { setFileName(""); setSummary(dashboardSeed); setStatus("Tela limpa."); }}>Limpar tela</Button></div></form><p className="muted" style={{ marginTop: 18 }}>{status}</p></Card>
        <Card className="pad"><h2>Resumo detectado</h2><div className="grid grid-2"><Card className="metric-card"><b className="text-green">● Receita confirmada</b><strong>{formatCurrency(summary.confirmedRevenue)}</strong></Card><Card className="metric-card"><b className="text-red">● Descontos</b><strong>{formatCurrency(summary.discountsApplied)}</strong></Card><Card className="metric-card"><b className="text-purple">● Faturamento previsto</b><strong>{formatCurrency(summary.expectedRevenue)}</strong></Card><Card className="metric-card"><b className="text-red">● Cancelados</b><strong>{formatNumber(summary.canceledEvents)}</strong></Card></div></Card>
      </div>
    </div>
  );
}
''')

# Configuracoes remove real values as prefilled data.
p=base/'src/app/(system)/configuracoes/page.tsx'
s=p.read_text(encoding='utf-8')
s=s.replace('defaultValue="Sistema de Gestão CEJAS"','placeholder="Sistema de Gestão CEJAS"')
s=s.replace('defaultValue="Painel Administrativo"','placeholder="Painel Administrativo"')
s=s.replace('defaultValue="Sistema Comercial CEJAS v2026"','placeholder="Rodapé do sistema"')
s=s.replace('defaultValue="Centro Empresarial de Jaraguá do Sul - CEJAS"','placeholder="Razão social"')
s=s.replace('defaultValue="83.784.124/0001-32"','placeholder="CNPJ"')
s=s.replace('defaultValue="Rua Octaviano Lombardi, 100"','placeholder="Endereço"')
s=s.replace('defaultValue="Jaraguá do Sul - SC"','placeholder="Cidade / UF"')
s=s.replace('defaultValue="22:00"','placeholder="22:00"')
s=s.replace('defaultValue="Orçamento válido por 72 horas. A pré-reserva garante o espaço por este período."','placeholder="Condições comerciais padrão"')
s=s.replace('<div className="file-card-list"><div className="file-row"><b>Salas</b><span>Ativo</span><Button variant="dark">Editar</Button></div><div className="file-row"><b>Equipamentos</b><span>Ativo</span><Button variant="dark">Editar</Button></div><div className="file-row"><b>Serviços</b><span>Ativo</span><Button variant="dark">Editar</Button></div></div>','<div className="file-card-list"><p className="muted">Nenhuma rubrica cadastrada ainda.</p></div>')
p.write_text(s, encoding='utf-8')

# Add empty state table rows where maps would show nothing, minimal replacements for financeiro/servidor/usuarios/gratuidades/agenda.
# Add CSS class for empty tables.
p=base/'src/app/globals.css'
s=p.read_text(encoding='utf-8')
if '.empty-state' not in s:
    s += '\n.empty-state{padding:28px;color:var(--muted);text-align:center}\n'
p.write_text(s, encoding='utf-8')

# Clean schema without seed inserts.
w('supabase/schema.sql', r'''
-- Sistema de Gestão CEJAS
-- Fonte oficial de dados: Supabase Database
-- Rode este arquivo no SQL Editor do Supabase antes do deploy.
-- Este schema cria estrutura vazia: sem eventos, sem relatórios, sem financeiro, sem arquivos e sem usuários pré-cadastrados.

create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null default 'Leitura',
  permissions text[] not null default '{}',
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null,
  storage_path text not null,
  total_events integer not null default 0,
  confirmed_events integer not null default 0,
  pending_events integer not null default 0,
  canceled_events integer not null default 0,
  expected_revenue numeric(12,2) not null default 0,
  confirmed_revenue numeric(12,2) not null default 0,
  discounts_applied numeric(12,2) not null default 0,
  extracted_text_preview text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete set null,
  date date not null,
  start_time time,
  end_time time,
  title text not null,
  company text,
  room text,
  origin text not null default 'Manual',
  participants integer default 0,
  responsible text,
  amount numeric(12,2) not null default 0,
  discount_value numeric(12,2) not null default 0,
  status text not null default 'em_espera' check (status in ('confirmado', 'em_espera', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_date on events(date);
create index if not exists idx_events_status on events(status);
create index if not exists idx_events_room on events(room);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  event_name text not null,
  issuer text not null default 'EDUARDO',
  customer_type text not null default 'associado',
  day_type text not null default 'dias_uteis',
  notes text,
  event_date date,
  start_time time,
  end_time time,
  total numeric(12,2) not null default 0,
  status text not null default 'rascunho',
  pdf_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  rubric text not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_value numeric(12,2) not null default 0,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete set null,
  budget_id uuid references budgets(id) on delete set null,
  client text not null,
  date date,
  budget_label text,
  boleto_status text not null default 'Não emitido',
  demonstrativo_status text not null default 'Não emitido',
  payment_status text not null default 'Pendente',
  billing_status text not null default 'Em aberto',
  amount numeric(12,2) not null default 0,
  files_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gratuities (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  event text not null,
  beneficiary text not null,
  type text not null check (type in ('orgao', 'associado', 'nao_associado')),
  total_value numeric(12,2) not null default 0,
  paid_value numeric(12,2) not null default 0,
  loss_value numeric(12,2) not null default 0,
  notes text,
  responsible text,
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  module text,
  priority text not null default 'média',
  due_date date,
  status text not null default 'pendente',
  assigned_to uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references app_users(id) on delete set null,
  receiver_id uuid references app_users(id) on delete set null,
  body text,
  attachment_path text,
  created_at timestamptz not null default now()
);

create table if not exists server_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null unique,
  size bigint not null default 0,
  mime_type text not null default 'application/octet-stream',
  year text,
  month text,
  event_name text,
  file_type text,
  uploaded_by uuid references app_users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete set null,
  budget_id uuid references budgets(id) on delete set null,
  client text not null,
  title text not null,
  status text not null default 'Em elaboração',
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists rubrics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table app_users enable row level security;
alter table reports enable row level security;
alter table events enable row level security;
alter table budgets enable row level security;
alter table budget_items enable row level security;
alter table finance_entries enable row level security;
alter table gratuities enable row level security;
alter table tasks enable row level security;
alter table chat_messages enable row level security;
alter table server_files enable row level security;
alter table contracts enable row level security;
alter table settings enable row level security;
alter table rubrics enable row level security;

-- A aplicação usa API Routes com SUPABASE_SERVICE_ROLE_KEY para leitura/escrita no servidor.
-- Não use service role no frontend.
do $$ begin
  create policy "Authenticated users can read events" on events for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can read files" on server_files for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
''')

w('supabase/reset-clean.sql', r'''
-- Limpeza total dos dados CEJAS no Supabase.
-- Use somente quando quiser deixar o sistema zerado para começar de novo.

truncate table
  chat_messages,
  tasks,
  budget_items,
  budgets,
  finance_entries,
  gratuities,
  server_files,
  contracts,
  events,
  reports,
  app_users,
  rubrics,
  settings
restart identity cascade;
''')

# README replacements
p=base/'README.md'
s=p.read_text(encoding='utf-8')
s=s.replace('Sem variáveis do Supabase, o sistema usa seed controlado apenas para visualização da interface. Com Supabase configurado, as rotas `/api/*` passam a persistir no banco e no Storage.','Sem variáveis do Supabase, o sistema fica em modo leitura vazio e não salva dados localmente. Com Supabase configurado, as rotas `/api/*` persistem no banco e no Storage.')
s=s.replace('## Seed inicial oficial','## Banco limpo')
s=s.replace('O arquivo `supabase/schema.sql` cria as tabelas e insere o usuário Eduardo/Superadmin, rubricas e dados oficiais conhecidos do último relatório.','O arquivo `supabase/schema.sql` cria somente a estrutura vazia. Ele não insere eventos, relatórios, arquivos, financeiro, gratuidades, usuários ou rubricas. Para limpar um banco já testado, rode `supabase/reset-clean.sql` no SQL Editor do Supabase.')
p.write_text(s, encoding='utf-8')



# Final idempotent fixes
p=base/'tsconfig.json'
if p.exists():
    s=p.read_text(encoding='utf-8').replace('"ignoreDeprecations": "5.0",','"ignoreDeprecations": "6.0",')
    p.write_text(s, encoding='utf-8')

p=base/'README.md'
if p.exists():
    s=p.read_text(encoding='utf-8')
    old="""## Banco limpo\n\n- Total de eventos: 1355\n- Eventos confirmados: 995\n- Eventos em espera: 38\n- Eventos cancelados: 322\n- Faturamento previsto: R$ 336.231,00\n- Receita confirmada: R$ 320.596,00\n- Descontos aplicados: R$ 1.470,00"""
    new="""## Banco limpo\n\nO sistema inicia zerado. Nenhum evento, relatório, orçamento, lançamento financeiro, gratuidade, arquivo, contrato, tarefa, usuário ou rubrica é criado automaticamente.\n\nPara limpar um banco já usado em teste, rode `supabase/reset-clean.sql` no SQL Editor do Supabase."""
    s=s.replace(old,new)
    p.write_text(s, encoding='utf-8')


# Fix fechamento do campo Fim em Orçamentos
p=base/'src/app/(system)/orcamentos/page.tsx'
if p.exists():
    s=p.read_text(encoding='utf-8')
    s=s.replace('onChange={(event) => setEndTime(event.target.value)} /></div>', 'onChange={(event) => setEndTime(event.target.value)} /></Field></div>')
    p.write_text(s, encoding='utf-8')

PY
echo 'Sistema CEJAS ajustado para iniciar limpo, sem seed/mock e sem fallback local.'
echo 'Agora rode: npm install && npm run typecheck && npm run dev'
