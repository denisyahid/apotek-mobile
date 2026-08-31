"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Pill, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";

/**
 * Bottom navigation pasien — fixed di bawah layar, safe-area aware.
 * Disembunyikan pada alur fokus (checkout/pembayaran/chat fullscreen).
 */
const HIDDEN_ROUTES = [/^\/checkout/, /^\/pembayaran/, /^\/konsultasi\/[^/]+/, /^\/obat\/[^/]+/];

const ITEMS = [
  { href: "/", label: "Beranda", icon: Home, exact: true },
  { href: "/obat", label: "Obat", icon: Pill },
  { href: "/konsultasi", label: "Konsultasi", icon: MessageCircle },
  { href: "/keranjang", label: "Keranjang", icon: ShoppingBag, badge: true },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { count } = useCart();

  if (HIDDEN_ROUTES.some((r) => r.test(pathname))) return null;

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 shadow-nav backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-5xl grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 pt-1 pb-1.5 text-[11px] font-semibold transition-colors ${
                  active ? "text-primary-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className="relative">
                  <Icon size={22} aria-hidden strokeWidth={active ? 2.4 : 2} />
                  {"badge" in item && item.badge && count > 0 && (
                    <span
                      aria-label={`${count} item di keranjang`}
                      className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                {item.label}
                {active && (
                  <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-primary-600" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
