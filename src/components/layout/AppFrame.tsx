import { Sidebar } from "@/components/layout/Sidebar";
export function AppFrame({ children }: { children: React.ReactNode }) { return <div className="app-frame"><Sidebar /><main className="app-main">{children}</main></div>; }
