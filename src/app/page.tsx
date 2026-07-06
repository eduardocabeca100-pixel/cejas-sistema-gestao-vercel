"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setTimeout(() => router.push("/dashboard"), 450); }
  return <main className="login-page"><section className="login-shell"><div className="login-brand"><div className="login-logo-card"><strong>CEJAS</strong><span>Centro Empresarial de Jaraguá do Sul</span></div><p>S I S T E M A &nbsp; I N T E R N O</p></div><form className="login-panel" onSubmit={handleSubmit}><h1>Entrar</h1><p>Entre com seu e-mail institucional do CEJAS.</p><label><span>E-MAIL INSTITUCIONAL</span><input placeholder="seuemail@cejas.com.br" type="email" /></label><label><span>SENHA</span><div className="password-row"><input placeholder="Digite sua senha" type="password" /><small>👁️</small></div></label><div className="login-options"><label className="check-inline"><input type="checkbox" /> Manter-me conectado</label><a>Esqueci minha senha</a></div><button className="login-button" type="submit">{loading ? "Entrando..." : "Entrar"}</button><div className="login-note">Acesso restrito ao login institucional do CEJAS.</div></form></section></main>;
}
