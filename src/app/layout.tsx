import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Sistema de Gestão CEJAS", description: "Sistema interno administrativo do CEJAS" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
