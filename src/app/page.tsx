"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("expirado")) {
      setErro("Sua sessão expirou. Entre novamente.");
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, lembrar })
      });
      const json = await response.json();
      if (!json.ok) {
        setErro(json.error || "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-brand">
          <div className="login-logo-card"><strong>CEJAS</strong><span>Centro Empresarial de Jaraguá do Sul</span></div>
          <p>S I S T E M A &nbsp; I N T E R N O</p>
        </div>
        <form className="login-panel" onSubmit={handleSubmit}>
          <h1>Entrar</h1>
          <p>Entre com seu e-mail institucional do CEJAS.</p>
          <label>
            <span>E-MAIL INSTITUCIONAL</span>
            <input placeholder="seuemail@cejas.com.br" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label>
            <span>SENHA</span>
            <div className="password-row">
              <input placeholder="Digite sua senha" type={mostrarSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
              <small role="button" onClick={() => setMostrarSenha((v) => !v)} style={{ cursor: "pointer" }}>👁️</small>
            </div>
          </label>
          {erro && <div className="login-note" style={{ color: "#f87171" }}>{erro}</div>}
          <div className="login-options">
            <label className="check-inline"><input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} /> Manter-me conectado</label>
          </div>
          <button className="login-button" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
          <div className="login-note">Acesso restrito ao login institucional do CEJAS.</div>
        </form>
      </section>
    </main>
  );
}
