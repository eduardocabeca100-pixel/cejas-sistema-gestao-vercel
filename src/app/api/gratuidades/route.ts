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
