import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, getStorageBucket } from "@/lib/supabase/admin";
import { parseSummary, tryExtractPdfText } from "@/lib/reports/parse";

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
  const parsed = parseSummary(text);
  const summary = { ...parsed, original_filename: originalFilename, extracted_text_preview: text.slice(0, 4000) };

  const { data: report, error: reportError } = await supabase.from("reports").insert({ ...summary, storage_path: path, processed_at: new Date().toISOString() }).select().single();
  if (reportError || !report) return NextResponse.json({ ok: false, error: reportError?.message || "Erro ao salvar relatório." }, { status: 500 });

  return NextResponse.json({ ok: true, report, summary, message: "PDF salvo no Storage e resumo registrado no banco." });
}
