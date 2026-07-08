import { Sidebar } from "@/components/layout/Sidebar";
import type { SessionPayload } from "@/lib/auth/session";

export function AppFrame({ children, user }: { children: React.ReactNode; user: SessionPayload | null }) {
  return <div className="app-frame"><Sidebar user={user} /><main className="app-main">{children}</main></div>;
}
