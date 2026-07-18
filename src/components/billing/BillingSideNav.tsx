"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCardIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";

const BILLING_LINKS = [
  {
    href: "/billing/app",
    label: "App Billing",
    icon: CreditCardIcon,
    description: "Plans, payments & invoices",
  },
  {
    href: "/billing/ai-usage",
    label: "AI Usage",
    icon: CpuChipIcon,
    description: "Credits & AI activity logs",
  },
];

export function BillingSideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
        Billing
      </p>
      <nav className="mt-3 flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        {BILLING_LINKS.map(({ href, label, icon: Icon, description }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "group flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)] dark:bg-teal-950/40 dark:text-teal-100"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-4 w-4 shrink-0 transition-colors",
                  active
                    ? "text-[var(--app-primary)]"
                    : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300",
                ].join(" ")}
              />
              <div className="min-w-0">
                <span className="block truncate">{label}</span>
                <span className="block truncate text-[10px] font-normal opacity-60 lg:block hidden">
                  {description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
