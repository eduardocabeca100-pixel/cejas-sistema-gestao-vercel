import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { hydrateLiveUser } from "@/lib/auth/live-session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const out: Record<string, unknown> = {
    hasCookie: Boolean(token),
    hasSessionSecretEnv: Boolean(process.env.SESSION_SECRET),
    runtime: process.env.NEXT_RUNTIME || "unknown"
  };

  const tokenSession = await verifySessionToken(token);
  out.verifyOk = Boolean(tokenSession);
  out.tokenSessionHasUid = Boolean(tokenSession?.uid);
  out.tokenSessionExpired = tokenSession ? tokenSession.exp < Math.floor(Date.now() / 1000) : null;

  if (tokenSession) {
    try {
      const live = await hydrateLiveUser(tokenSession);
      out.hydrateOk = Boolean(live);
    } catch (error) {
      out.hydrateThrew = true;
    }
  }

  return NextResponse.json(out);
}
