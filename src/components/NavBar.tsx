"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n";

export default function NavBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const links = [
    { href: "/", label: t("nav_dashboard"), icon: "◆" },
    { href: "/expenses", label: t("nav_expenses"), icon: "＋" },
    { href: "/goals", label: t("nav_goals"), icon: "◎" },
    { href: "/subscriptions", label: t("nav_subscriptions"), icon: "↻" },
    { href: "/settings", label: t("nav_settings"), icon: "⚙" },
  ];

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex items-center justify-between max-w-5xl mx-auto px-8 pt-6">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          Nuvio
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

      {/* Mobile bottom nav — expense entry always one tap away */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-mist z-20 flex justify-around py-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs",
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
