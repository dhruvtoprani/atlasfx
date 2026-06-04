"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Brain, Globe2, Info, ListOrdered } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Map", icon: Globe2 },
  { href: "/rankings", label: "Rankings", icon: ListOrdered },
  { href: "/model", label: "Model", icon: Brain },
  { href: "/about", label: "About", icon: Info },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              <Activity className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100">AtlasFX</span>
              <span className="block text-xs text-slate-500">Currency stress radar</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white",
                    active && "bg-white/[0.08] text-cyan-100",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-slate-400",
                  active && "bg-white/[0.08] text-cyan-100",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
