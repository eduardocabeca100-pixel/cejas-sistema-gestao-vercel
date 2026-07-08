import { Sidebar } from "@/components/layout/Sidebar";
import type { SessionPayload } from "@/lib/auth/session";
import { CurrentUserProvider } from "@/lib/auth/user-context";

export function AppFrame({ children, user }: { children: React.ReactNode; user: SessionPayload | null }) {
  return (
    <CurrentUserProvider user={user}>
      <div className="app-frame"><Sidebar user={user} /><main className="app-main">{children}</main></div>
    </CurrentUserProvider>
  );
}
