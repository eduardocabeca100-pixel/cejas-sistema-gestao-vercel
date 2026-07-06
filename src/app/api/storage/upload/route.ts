import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, getStorageBucket } from "@/lib/supabase/admin";

function sanitizeSegment(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._ -]/g, "").trim().replace(/\s+/g, "_");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);
  const year = String(formData.get("year") || new Date().getFullYear());
  const month = String(formData.get("month") || `${new Date().getMonth() + 1}`.padStart(2, "0"));
  const eventName = sanitizeSegment(String(formData.get("eventName") || "GERAL"));
  const fileType = sanitizeSegment(String(formData.get("fileType") || "ARQUIVOS"));
  const mode = String(formData.get("mode") || "automatico");

  if (!files.length) return NextResponse.json({ ok: false, error: "Nenhum arquivo enviado." }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O sistema não salva arquivos localmente." }, { status: 503 });

  const uploaded = [];
  for (const file of files) {
    const originalPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const relativePath = originalPath.split("/").map(sanitizeSegment).filter(Boolean).join("/");
    const finalPath = mode === "pasta_original" ? `${year}/${relativePath}` : `${year}/${month}/${eventName}/${fileType}/${Date.now()}-${sanitizeSegment(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(getStorageBucket()).upload(finalPath, buffer, { contentType: file.type || "application/octet-stream", upsert: true });
    if (uploadError) return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });

    const { data, error } = await supabase.from("server_files").insert({ name: file.name, path: finalPath, size: file.size, mime_type: file.type || "application/octet-stream", year, month, event_name: eventName, file_type: fileType }).select().single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    uploaded.push(data);
  }
  return NextResponse.json({ ok: true, uploaded });
}
