"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon, SwatchIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useAppearance } from "@/context/AppearanceContext";
import { isNavActive, NAV_SECTIONS } from "@/config/navigation";
import { usePermissionAccess } from "@/lib/usePermissionAccess";

export function AppSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, setIsSidebarCollapsed, setIsAppearanceOpen } = useAppearance();
  const [mounted, setMounted] = useState(false);
  const { ready, canAccessPath, guardPathAccess } = usePermissionAccess();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside
      className={`sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-zinc-300/80 app-sidebar shadow-[inset_-1px_0_0_rgba(0,0,0,0.04)] backdrop-blur-md dark:border-white/[0.07] dark:bg-zinc-950/80 dark:shadow-none transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-[72px]" : "w-[272px]"
      }`}
    >
      {/* Sidebar Header */}
      <div className={`flex h-[4.5rem] items-center ${isSidebarCollapsed ? "justify-center" : "px-5"}`}>
        <Link
          href="/dashboard"
          className={`flex items-center transition-colors hover:bg-white/60 dark:hover:bg-white/[0.04] ${
            isSidebarCollapsed ? "h-12 w-12 justify-center rounded-xl" : "gap-1.5 overflow-hidden rounded-[13px] p-1"
          }`}
          title={isSidebarCollapsed ? "ANSH Tasks Workspace" : undefined}
        >
          <img 
            src="/logoAnshapps.png" 
            alt="ANSH Logo" 
            className={`shrink-0 object-contain transition-all duration-200 ${
              isSidebarCollapsed ? "h-9 w-9" : "h-13 w-13"
            }`} 
          />
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <span className="block truncate font-heading text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                ANSH Tasks
              </span>
              <span className="block text-[11px] font-normal leading-tight text-zinc-500 dark:text-zinc-400">
                Workspace
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 space-y-6 overflow-y-auto py-3 ${isSidebarCollapsed ? "px-2" : "px-3"}`}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-1">
            {!isSidebarCollapsed ? (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400/90 dark:text-zinc-500/90">
                {section.label}
              </p>
            ) : (
              <div className="h-px bg-zinc-300/40 my-3 dark:bg-white/[0.06] mx-2" />
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, match }) => {
                const active = isNavActive(pathname, href, match ?? "prefix");
                const layoutId = `nav-pill-${href.replace(/\//g, "-") || "root"}`;
                const allowed = !ready || canAccessPath(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={isSidebarCollapsed ? label : undefined}
                    onClick={(e) => {
                      if (!guardPathAccess(href)) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    aria-disabled={!allowed}
                    className={[
                      "group relative flex min-h-[2.5rem] items-center rounded-[11px] transition-colors",
                      isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3 text-[13px] font-medium",
                      !allowed ? "opacity-45 cursor-not-allowed" : "",
                      active
                        ? "text-[var(--app-primary-soft-text)] dark:text-teal-100"
                        : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100",
                    ].join(" ")}
                  >
                    {active && (
                      <motion.div
                        layoutId={layoutId}
                        className="absolute inset-0 rounded-[11px] border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)]/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-teal-500/15 dark:bg-teal-950/35 dark:shadow-none"
                        transition={{ type: "spring", bounce: 0.12, duration: 0.42 }}
                      />
                    )}
                    <Icon
                      className={[
                        "relative z-10 h-[1.15rem] w-[1.15rem] shrink-0 transition-colors",
                        active
                          ? "text-[var(--app-primary)]"
                          : "text-zinc-450 group-hover:text-zinc-700 dark:group-hover:text-zinc-300",
                      ].join(" ")}
                    />
                    {!isSidebarCollapsed && <span className="relative z-10 truncate">{label}</span>}
                    {active && (
                      <div className="absolute top-1/2 left-0.5 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--app-primary)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Panel (Footer Options) */}
      <div className="border-t border-zinc-200/60 p-3 dark:border-white/[0.06] space-y-1">
        {mounted && (
          <>
            {/* Appearance Option */}
            {isSidebarCollapsed ? (
              <button
                onClick={() => setIsAppearanceOpen(true)}
                className="group relative flex h-11 w-11 items-center justify-center rounded-[11px] transition-colors mx-auto text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100 cursor-pointer"
                title="Customize Theme & Appearance"
              >
                <SwatchIcon className="relative z-10 h-[1.15rem] w-[1.15rem] shrink-0 transition-colors text-zinc-450 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
              </button>
            ) : (
              <button
                onClick={() => setIsAppearanceOpen(true)}
                className="group relative flex min-h-[2.5rem] w-full items-center rounded-[11px] transition-colors text-left gap-3 px-3 text-[13px] font-medium text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100 cursor-pointer"
                title="Customize Theme & Appearance"
              >
                <SwatchIcon className="relative z-10 h-[1.15rem] w-[1.15rem] shrink-0 transition-colors text-zinc-450 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                <span className="relative z-10 truncate">Theme & Appearance</span>
              </button>
            )}

            {/* Collapse/Expand Toggle */}
            {isSidebarCollapsed ? (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="group relative flex h-11 w-11 items-center justify-center rounded-[11px] transition-colors mx-auto text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100 cursor-pointer"
                title="Expand Sidebar"
              >
                <ChevronRightIcon className="relative z-10 h-[1.15rem] w-[1.15rem] shrink-0 transition-colors text-zinc-450 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
              </button>
            ) : (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="group relative flex min-h-[2.5rem] w-full items-center rounded-[11px] transition-colors text-left gap-3 px-3 text-[13px] font-medium text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100 cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeftIcon className="relative z-10 h-[1.15rem] w-[1.15rem] shrink-0 transition-colors text-zinc-450 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                <span className="relative z-10 truncate">Collapse Sidebar</span>
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
