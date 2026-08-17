import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { FinanceProvider } from "@/lib/use-finance";

export const metadata: Metadata = {
  title: "Nuvio — Spend smart. Stay safe.",
  description: "Sabe cuánto puedes gastar hoy, sin comprometer tus obligaciones ni tus metas.",
  authors: [{ name: "Gonzalo Suarez" }],
  creator: "Gonzalo Suarez",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen pb-24 md:pb-8">
        <FinanceProvider>
          <NavBar />
          <main className="max-w-5xl mx-auto px-4 md:px-8 pt-6">{children}</main>
          <footer className="max-w-5xl mx-auto px-4 md:px-8 py-8 text-center text-xs text-ink/35">
            Nuvio — Spend smart. Stay safe. · Creado por Gonzalo Suarez
          </footer>
        </FinanceProvider>
      </body>
    </html>
  );
}
