"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextInput } from "@/components/ui/Form";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function carregar() {
    fetch("/api/chat", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).then(setMessages).catch(() => {});
  }

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    setEnviando(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) });
      const json = await response.json();
      if (!json.ok) return alert(json.error);
      setText("");
      carregar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="COMUNICAÇÃO INTERNA" title="Chat CEJAS" description="Canal interno administrativo. Todas as mensagens ficam salvas no Supabase." />
      <Card className="chat-shell">
        <aside className="chat-sidebar">
          <div className="chat-title"><h2>Canal geral</h2><p className="muted">Visível para todos os usuários do sistema</p></div>
          <div className="empty-chat">{messages.length} mensagens</div>
        </aside>
        <section className="chat-main">
          <div className="chat-title"><h2>Canal geral</h2><p className="muted">Mensagens sincronizadas automaticamente</p></div>
          <div className="empty-chat" ref={listRef} style={{ display: "block", overflowY: "auto", textAlign: "left", padding: 18 }}>
            {!messages.length && "Nenhuma mensagem ainda. Envie a primeira."}
            {messages.map((msg) => <p key={msg.id}><b>{msg.senderName}:</b> {msg.body} <span className="muted" style={{ fontSize: 11 }}>{new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></p>)}
          </div>
          <form className="chat-compose" onSubmit={enviar}>
            <Button type="button" variant="ghost" disabled>📎</Button>
            <TextInput value={text} onChange={(event) => setText(event.target.value)} placeholder="Digite sua mensagem..." />
            <Button type="submit" disabled={enviando}>{enviando ? "..." : "Enviar"}</Button>
          </form>
        </section>
      </Card>
    </div>
  );
}
