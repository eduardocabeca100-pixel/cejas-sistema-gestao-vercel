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
    const { error: itemsError } = await supabase.from("budget_items").insert(body.items.map((item: any) => ({
      budget_id: budget.id,
      rubric: item.rubric,
      description: item.description,
      quantity: item.quantity,
      unit_value: item.unitValue,
      details: item.details
    })));
    if (itemsError) return NextResponse.json({ ok: false, error: `Orçamento salvo, mas os itens não foram gravados: ${itemsError.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, budget });
}
