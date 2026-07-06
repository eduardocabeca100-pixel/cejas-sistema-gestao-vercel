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
