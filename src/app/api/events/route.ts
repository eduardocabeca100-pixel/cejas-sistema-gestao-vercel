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
