import { AppFrame } from "@/components/layout/AppFrame";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function SystemLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <AppFrame user={user}>{children}</AppFrame>;
}
