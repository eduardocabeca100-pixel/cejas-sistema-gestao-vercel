import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Sessão expirada. Faça login novamente." }, { status: 401 });
    }
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("expirado", "1");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agenda/:path*",
    "/painel-do-dia/:path*",
    "/chat/:path*",
    "/orcamentos/:path*",
    "/financeiro/:path*",
    "/gratuidades/:path*",
    "/tarefas/:path*",
    "/servidor/:path*",
    "/contratos/:path*",
    "/importar-relatorio/:path*",
    "/usuarios/:path*",
    "/configuracoes/:path*",
    "/api/events/:path*",
    "/api/dashboard/:path*",
    "/api/financeiro/:path*",
    "/api/gratuidades/:path*",
    "/api/import-report/:path*",
    "/api/orcamentos/:path*",
    "/api/servidor/:path*",
    "/api/storage/:path*",
    "/api/usuarios/:path*",
    "/api/contratos/:path*",
    "/api/configuracoes/:path*",
    "/api/tarefas/:path*",
    "/api/chat/:path*"
  ]
};
