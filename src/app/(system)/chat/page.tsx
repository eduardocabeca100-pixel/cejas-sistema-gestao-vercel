"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextInput } from "@/components/ui/Form";

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{ author: string; text: string }>>([]);
  const [text, setText] = useState("");

  return (
    <div>
      <PageHeader eyebrow="COMUNICAÇÃO INTERNA" title="Chat CEJAS" description="Converse com usuários do sistema. Você também pode enviar imagens ou arrastar a imagem para dentro da conversa." actions={<Button variant="dark">Voltar ao Painel</Button>} />
      <Card className="chat-shell">
        <aside className="chat-sidebar">
          <div className="chat-title"><h2>Conversas</h2><p className="muted">Usuários cadastrados</p></div>
          <div className="empty-chat">Nenhum outro usuário cadastrado.</div>
        </aside>
        <section className="chat-main">
          <div className="chat-title"><h2>Selecione uma conversa</h2><p className="muted">Canal interno administrativo</p></div>
          <div className="empty-chat">
            {messages.length ? <div>{messages.map((msg, index) => <p key={index}><b>{msg.author}:</b> {msg.text}</p>)}</div> : "Escolha um usuário para iniciar."}
          </div>
          <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); if (!text.trim()) return; setMessages((m) => [...m, { author: "Eduardo", text }]); setText(""); }}>
            <Button type="button" variant="ghost">📎</Button>
            <TextInput value={text} onChange={(event) => setText(event.target.value)} placeholder="Digite sua mensagem..." />
            <Button type="submit">Enviar</Button>
          </form>
        </section>
      </Card>
    </div>
  );
}
