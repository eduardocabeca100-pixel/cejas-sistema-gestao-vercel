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

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "ID não informado." }, { status: 400 });

  const loss = Number(body.paidValue || 0) - Number(body.totalValue || 0);
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado." }, { status: 503 });

  const { data, error } = await supabase.from("gratuities").update({
    date: body.date,
    event: body.event,
    beneficiary: body.beneficiary,
    type: body.type,
    total_value: body.totalValue,
    paid_value: body.paidValue,
    loss_value: loss,
    notes: body.notes,
    responsible: body.responsible,
    status: body.status
  }).eq("id", id).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, gratuity: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "ID não informado." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado." }, { status: 503 });

  const { error } = await supabase.from("gratuities").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
