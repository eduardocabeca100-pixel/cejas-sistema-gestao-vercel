import type { UserProfile } from "@/types";

export const SESSION_COOKIE_NAME = "cejas_session";
const DEFAULT_SESSION_SECONDS = 8 * 60 * 60; // 8h, igual ao sistema antigo
const REMEMBER_SESSION_SECONDS = 30 * 24 * 60 * 60; // 30 dias com "manter conectado"

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  role: UserProfile | string;
  permissions: string[];
  isSuperadmin: boolean;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET não configurado (defina uma string aleatória com 32+ caracteres nas variáveis de ambiente).");
  }
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">, rememberMe = false): Promise<{ token: string; maxAge: number }> {
  const maxAge = rememberMe ? REMEMBER_SESSION_SECONDS : DEFAULT_SESSION_SECONDS;
  const fullPayload: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + maxAge };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(fullPayload));
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  const token = `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(new Uint8Array(signature))}`;
  return { token, maxAge };
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  try {
    const key = await getSigningKey();
    const payloadBytes = base64UrlDecode(payloadPart);
    const signatureBytes = base64UrlDecode(signaturePart);
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes as BufferSource, payloadBytes as BufferSource);
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
