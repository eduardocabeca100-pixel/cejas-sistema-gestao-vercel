import { NextRequest, NextResponse } from "next/server";
import { getContracts } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() { return NextResponse.json(await getContracts()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.client || !body.title) return NextResponse.json({ ok: false, error: "Informe cliente e título do contrato." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva contratos localmente." }, { status: 503 });

  const { data, error } = await supabase.from("contracts").insert({
    client: body.client,
    title: body.title,
    status: body.status || "Em elaboração",
    event_id: body.eventId || null,
    budget_id: body.budgetId || null
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, contract: data });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  if (!body.id) return NextResponse.json({ ok: false, error: "Contrato não informado." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado." }, { status: 503 });

  const { data, error } = await supabase.from("contracts").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, contract: data });
}
