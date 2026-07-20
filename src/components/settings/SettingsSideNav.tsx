"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavActive } from "@/config/navigation";
import { usePermissionAccess } from "@/lib/usePermissionAccess";

const LINKS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/company", label: "Company" },
  { href: "/settings/workspace", label: "Workspace" },
  { href: "/settings/permissions", label: "Permissions" },
  { href: "/settings/defaults", label: "Defaults" },
  { href: "/settings/delete-account", label: "Delete Account" },
] as const;

export function SettingsSideNav() {
  const pathname = usePathname();
  const { ready, canAccessPath, guardPathAccess } = usePermissionAccess();

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
        Settings
      </p>
      <nav className="mt-3 flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        {LINKS.map(({ href, label }) => {
          const active = isNavActive(pathname, href, "exact");
          const allowed = !ready || canAccessPath(href);
          const isDelete = href === "/settings/delete-account";
          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => {
                if (!guardPathAccess(href)) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              aria-disabled={!allowed}
              className={[
                "whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                !allowed ? "opacity-45 cursor-not-allowed" : "",
                isDelete
                  ? active
                    ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                    : "text-red-500 hover:bg-red-50/50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/20"
                  : active
                    ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)] dark:bg-teal-950/40 dark:text-teal-100"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
