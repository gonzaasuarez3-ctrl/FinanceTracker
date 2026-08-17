"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n";

export default function NavBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const links = [
    { href: "/", label: t("nav_dashboard"), icon: "◆" },
    { href: "/expenses", label: t("nav_expenses"), icon: "＋" },
    { href: "/fixed-expenses", label: "Fijos", icon: "▤" },
    { href: "/goals", label: t("nav_goals"), icon: "◎" },
    { href: "/subscriptions", label: t("nav_subscriptions"), icon: "↻" },
    { href: "/settings", label: t("nav_settings"), icon: "⚙" },
  ];

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex items-center justify-between max-w-5xl mx-auto px-8 pt-5">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo-icon.png" alt="Nuvio" width={44} height={44} priority className="h-11 w-auto" />
          <span className="font-display text-2xl tracking-tight text-ink">Nuvio</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                pathname === l.href
                  ? "bg-ink text-paper"
                  : "text-ink/70 hover:bg-mist/60"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobile top bar — logo gets real presence here too, not just a wordmark */}
      <header className="md:hidden flex items-center justify-center pt-5 pb-1">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="Nuvio" width={32} height={32} priority className="h-8 w-auto" />
          <span className="font-display text-xl tracking-tight text-ink">Nuvio</span>
        </Link>
      </header>

      {/* Mobile bottom nav — expense entry always one tap away */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-mist z-20 flex justify-around py-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[11px]",
              pathname === l.href ? "text-moss font-semibold" : "text-ink/50"
            )}
          >
            <span className="text-lg leading-none">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
