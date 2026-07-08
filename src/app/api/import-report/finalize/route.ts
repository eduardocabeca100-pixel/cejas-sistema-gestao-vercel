import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, getStorageBucket } from "@/lib/supabase/admin";
import { parseAgendamentosSalas, summarizeEvents, tryExtractPdfText } from "@/lib/reports/parse";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const path = String(body?.path || "");
  const originalFilename = String(body?.fileName || path.split("/").pop() || "relatorio.pdf");
  if (!path) return NextResponse.json({ ok: false, error: "Caminho do arquivo não informado." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado no servidor." }, { status: 503 });

  const { data: blob, error: downloadError } = await supabase.storage.from(getStorageBucket()).download(path);
  if (downloadError || !blob) return NextResponse.json({ ok: false, error: downloadError?.message || "Não foi possível ler o PDF enviado." }, { status: 500 });

  const buffer = Buffer.from(await blob.arrayBuffer());
  const text = await tryExtractPdfText(buffer);
  if (!text) return NextResponse.json({ ok: false, error: "Não foi possível extrair texto do PDF. Confirme que é um PDF gerado pelo Supera, não uma imagem escaneada." }, { status: 422 });

  const { events, warnings } = parseAgendamentosSalas(text);
  if (!events.length) return NextResponse.json({ ok: false, error: "Nenhum evento foi reconhecido nesse PDF. Confirme que é o relatório 'Agendamentos de Salas e Equipamentos' do Supera." }, { status: 422 });

  // O relatório é sempre um retrato completo da agenda futura: substitui todos os
  // eventos de origem "Supera" pelos recém-importados, sem mexer em eventos manuais.
  const { error: deleteError } = await supabase.from("events").delete().eq("origin", "Supera");
  if (deleteError) return NextResponse.json({ ok: false, error: `Erro ao limpar eventos anteriores do Supera: ${deleteError.message}` }, { status: 500 });

  const rows = events.map((event) => ({
    date: event.date,
    start_time: event.startTime,
    end_time: event.endTime,
    title: event.title,
    company: event.company,
    room: event.room,
    origin: "Supera",
    participants: event.participants,
    responsible: event.responsible,
    amount: event.amount,
    discount_value: 0,
    status: event.status
  }));

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: insertError } = await supabase.from("events").insert(chunk);
    if (insertError) return NextResponse.json({ ok: false, error: `Erro ao salvar eventos (lote ${i / chunkSize + 1}): ${insertError.message}` }, { status: 500 });
  }

  const summary = { ...summarizeEvents(events), original_filename: originalFilename, extracted_text_preview: text.slice(0, 4000) };
  const { data: report, error: reportError } = await supabase.from("reports").insert({ ...summary, storage_path: path, processed_at: new Date().toISOString() }).select().single();
  if (reportError || !report) return NextResponse.json({ ok: false, error: reportError?.message || "Erro ao salvar relatório." }, { status: 500 });

  return NextResponse.json({
    ok: true,
    report,
    summary,
    message: `${events.length} eventos importados e salvos na Agenda.${warnings.length ? ` (${warnings.length} aviso(s) de leitura, dados aproveitados mesmo assim.)` : ""}`
  });
}
