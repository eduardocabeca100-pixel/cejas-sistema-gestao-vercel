import { NextRequest, NextResponse } from "next/server";
import { getChatMessages } from "@/lib/server/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() { return NextResponse.json(await getChatMessages()); }

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.body || !String(body.body).trim()) return NextResponse.json({ ok: false, error: "Mensagem vazia." }, { status: 400 });

  const user = await getCurrentUser();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase não configurado. O chat não salva mensagens localmente." }, { status: 503 });

  const { data, error } = await supabase.from("chat_messages").insert({
    sender_id: user?.uid || null,
    receiver_id: body.receiverId || null,
    body: String(body.body).trim()
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: { id: data.id, senderId: data.sender_id, senderName: user?.name || "Usuário", body: data.body, createdAt: data.created_at } });
}
