import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado no servidor." }, { status: 503 });

  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!report) return NextResponse.json({ ok: true, report: null });

  return NextResponse.json({ ok: true, report });
}
