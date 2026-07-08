import { NextRequest, NextResponse } from "next/server";
import { getTasks } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() { return NextResponse.json(await getTasks()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.title) return NextResponse.json({ ok: false, error: "Informe o título da tarefa." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva tarefas localmente." }, { status: 503 });

  const { data, error } = await supabase.from("tasks").insert({
    title: body.title,
    description: body.description || null,
    module: body.module || "Geral",
    priority: body.priority || "média",
    due_date: body.dueDate || null,
    status: body.status || "pendente"
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, task: data });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  if (!body.id) return NextResponse.json({ ok: false, error: "Tarefa não informada." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado." }, { status: 503 });

  const { data, error } = await supabase.from("tasks").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, task: data });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Tarefa não informada." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado." }, { status: 503 });

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
