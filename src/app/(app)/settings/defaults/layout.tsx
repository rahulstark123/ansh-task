"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/config/navigation";

const SUB_LINKS = [
  { href: "/settings/defaults", label: "General Defaults" },
  { href: "/settings/defaults/categories", label: "Categories" },
  { href: "/settings/defaults/labels", label: "Labels" },
] as const;

export default function DefaultsSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-48">
        <Link
          href="/settings/profile"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-350 mb-5 transition-colors"
        >
          <span>←</span>
          <span>Back to Settings</span>
        </Link>
        
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-455 dark:text-zinc-500">
          Defaults Menu
        </p>
        <nav className="mt-3 flex flex-row gap-1.5 overflow-x-auto lg:flex-col lg:gap-1">
          {SUB_LINKS.map(({ href, label }) => {
            const active = isNavActive(pathname, href, "exact");
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-colors border",
                  active
                    ? "bg-zinc-100/80 border-zinc-200 text-zinc-800 dark:bg-zinc-850/60 dark:border-white/5 dark:text-zinc-100"
                    : "border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:hover:bg-white/5 dark:hover:text-zinc-300",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
