"use client";
import { createContext, useContext } from "react";
import type { SessionPayload } from "@/lib/auth/session";

const CurrentUserContext = createContext<SessionPayload | null>(null);

export function CurrentUserProvider({ user, children }: { user: SessionPayload | null; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): SessionPayload | null {
  return useContext(CurrentUserContext);
}
