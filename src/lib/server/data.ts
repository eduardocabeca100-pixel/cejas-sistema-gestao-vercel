import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dashboardSeed } from "@/lib/seed";
import type { AppUser, Budget, CejasEvent, ChatMessage, Contract, DashboardSummary, FinanceEntry, Gratuity, ServerFile, Task } from "@/types";

function emptyDashboard(source = "Supabase Database • nenhum dado importado ainda"): DashboardSummary {
  return { ...dashboardSeed, source, updatedAt: new Date().toISOString() };
}

/**
 * O PostgREST do Supabase limita cada resposta a 1000 linhas por padrão,
 * mesmo sem `.limit()` explícito. Com mais de um relatório importado a
 * tabela "events" já passa disso, então buscamos em páginas de 1000 até
 * a página vir incompleta (senão os meses mais recentes somem do app).
 */
async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  orderColumn?: string
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase.from(table).select(select).range(offset, offset + pageSize - 1);
    if (orderColumn) query = query.order(orderColumn, { ascending: true });
    const { data, error } = await query;
    if (error || !data || data.length === 0) break;
    rows.push(...(data as T[]));
    if (data.length < pageSize) break;
  }
  return rows;
}

function monthKey(dateValue?: string | null) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return { key, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return emptyDashboard("Supabase não configurado • sem dados locais de fallback");

  const [events, gratuities, finance] = await Promise.all([
    fetchAllRows<{ date: string; status: string; amount: number; discount_value: number }>(supabase, "events", "date,status,amount,discount_value"),
    fetchAllRows<{ date: string; loss_value: number }>(supabase, "gratuities", "date,loss_value"),
    fetchAllRows<{ amount: number; payment_status: string }>(supabase, "finance_entries", "amount,payment_status")
  ]);

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

  const revenueByMonth = new Map<string, { label: string; value: number; gratuityLoss: number }>();
  safeEvents
    .filter((event) => event.status === "confirmado")
    .forEach((event) => {
      const month = monthKey(event.date);
      if (!month) return;
      const current = revenueByMonth.get(month.key);
      revenueByMonth.set(month.key, { label: month.label, value: (current?.value || 0) + Number(event.amount || 0), gratuityLoss: current?.gratuityLoss || 0 });
    });

  (gratuities || []).forEach((item) => {
    const month = monthKey(item.date);
    if (!month) return;
    const current = revenueByMonth.get(month.key);
    const loss = Math.abs(Number(item.loss_value || 0));
    if (current) {
      revenueByMonth.set(month.key, { ...current, gratuityLoss: current.gratuityLoss + loss });
    } else {
      revenueByMonth.set(month.key, { label: month.label, value: 0, gratuityLoss: loss });
    }
  });

  const anosComDados = new Set<number>();
  safeEvents.forEach((event) => { const d = new Date(`${event.date}T00:00:00`); if (!Number.isNaN(d.getTime())) anosComDados.add(d.getFullYear()); });
  (gratuities || []).forEach((item) => { const d = new Date(`${item.date}T00:00:00`); if (!Number.isNaN(d.getTime())) anosComDados.add(d.getFullYear()); });
  if (anosComDados.size === 0) anosComDados.add(new Date().getFullYear());

  Array.from(anosComDados).forEach((ano) => {
    for (let mes = 0; mes < 12; mes++) {
      const month = monthKey(`${ano}-${String(mes + 1).padStart(2, "0")}-01`);
      if (!month) continue;
      if (!revenueByMonth.has(month.key)) revenueByMonth.set(month.key, { label: month.label, value: 0, gratuityLoss: 0 });
    }
  });

  const monthlyRevenue = Array.from(revenueByMonth.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, entry]) => ({ month: entry.label, value: entry.value, gratuityLoss: entry.gratuityLoss }));

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
    monthlyRevenue
  };
}

export async function getEvents(): Promise<CejasEvent[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const data = await fetchAllRows<Record<string, unknown>>(supabase, "events", "*", "date");
  return data.map((event: any) => ({
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

export async function getContracts(): Promise<Contract[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((contract) => ({
    id: contract.id,
    client: contract.client,
    title: contract.title,
    status: contract.status,
    storagePath: contract.storage_path || undefined,
    createdAt: contract.created_at
  }));
}

export async function getTasks(): Promise<Task[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description || "",
    module: task.module || "",
    priority: task.priority,
    dueDate: task.due_date || undefined,
    status: task.status,
    createdAt: task.created_at
  }));
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*, app_users(name)")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return data.map((message: any) => ({
    id: message.id,
    senderId: message.sender_id || undefined,
    senderName: message.app_users?.name || "Usuário",
    body: message.body || "",
    createdAt: message.created_at
  }));
}

export async function getSetting(key: string): Promise<Record<string, unknown> | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  if (error || !data) return null;
  return data.value as Record<string, unknown>;
}
