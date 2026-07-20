"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { SwatchIcon, Squares2X2Icon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, Fragment } from "react";
import { useAppearance } from "@/context/AppearanceContext";
import { isNavActive, NAV_SECTIONS } from "@/config/navigation";
import { usePermissionAccess } from "@/lib/usePermissionAccess";
import { useWorkspacePlan } from "@/lib/useWorkspacePlan";

const ECOSYSTEM_APPS = [
  {
    name: "ANSH Booking",
    subtext: "Meeting room & resource booking",
    status: "SOON",
    dotColor: "#ef4444",
    link: "https://booking.anshapps.com",
    statusColor: "red",
  },
  {
    name: "ANSH Visitor",
    subtext: "Smart lobby & guest management",
    status: "LIVE",
    dotColor: "#8b5cf6",
    link: "https://visitor.anshapps.com",
    statusColor: "purple",
  },
  {
    name: "ANSH Tasks",
    subtext: "Team task & project tracker",
    status: "HERE",
    dotColor: "#3b82f6",
    link: "https://tasks.anshapps.com",
    statusColor: "blue",
  },
  {
    name: "ANSH HR",
    subtext: "Human resource management",
    status: "LIVE",
    dotColor: "#8b5cf6",
    link: "https://hr.anshapps.com",
    statusColor: "purple",
  },
  {
    name: "ANSH Expense",
    subtext: "Expense & reimbursement tracking",
    status: "LIVE",
    dotColor: "#f97316",
    link: "https://expense.anshapps.com",
    statusColor: "orange",
  },
  {
    name: "ANSH Forms",
    subtext: "Smart form builder",
    status: "LIVE",
    dotColor: "#10b981",
    link: "https://forms.anshapps.com",
    statusColor: "green",
  },
  {
    name: "ANSH Links",
    subtext: "Link-in-bio profile builder",
    status: "LIVE",
    dotColor: "#ec4899",
    link: "https://links.anshapps.com",
    statusColor: "pink",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, setIsAppearanceOpen } = useAppearance();
  const [mounted, setMounted] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const { ready: permissionReady, canAccessPath, guardPathAccess } = usePermissionAccess();
  const { ready: planReady, canAccessPlanPath, guardPlanPathAccess } = useWorkspacePlan();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAppsOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".ansh-apps-container")) {
        setIsAppsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isAppsOpen]);

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
      <nav
        className={`app-sidebar-scroll flex-1 min-h-0 space-y-4 overflow-y-auto overflow-x-hidden py-2 ${
          isSidebarCollapsed ? "px-2" : "px-3"
        }`}
      >
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
                const allowed =
                  (!permissionReady || canAccessPath(href)) &&
                  (!planReady || canAccessPlanPath(href));
                const showAnshApps = href === "/billing";

                return (
                  <Fragment key={href}>
                    {showAnshApps && (
                      <div className="ansh-apps-container relative mb-1 px-0.5">
                        <button
                          type="button"
                          onClick={() => setIsAppsOpen(!isAppsOpen)}
                          title={isSidebarCollapsed ? "ANSH Apps Ecosystem" : undefined}
                          className={[
                            "group relative flex min-h-[2.5rem] w-full items-center rounded-[11px] transition-colors cursor-pointer",
                            isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto" : "justify-between px-3 text-[13px] font-medium",
                            isAppsOpen
                              ? "bg-zinc-100 text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-100"
                              : "text-zinc-650 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <Squares2X2Icon
                              className={[
                                "relative z-10 h-[1.15rem] w-[1.15rem] shrink-0 transition-colors",
                                isAppsOpen
                                  ? "text-[var(--app-primary)]"
                                  : "text-zinc-450 group-hover:text-zinc-700 dark:group-hover:text-zinc-300",
                              ].join(" ")}
                            />
                            {!isSidebarCollapsed && (
                              <span className="relative z-10 uppercase tracking-wider font-semibold text-[11px]">
                                ANSH Apps
                              </span>
                            )}
                          </div>
                          {!isSidebarCollapsed && (
                            isAppsOpen ? (
                              <ChevronUpIcon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-500" />
                            ) : (
                              <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-500" />
                            )
                          )}
                        </button>

                        {/* Popover */}
                        {isAppsOpen && (
                          <div
                            className={`absolute z-50 flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xl dark:border-white/[0.08] dark:bg-zinc-900/95 backdrop-blur-sm ${
                              isSidebarCollapsed
                                ? "bottom-0 left-[calc(100%+8px)] w-[280px]"
                                : "bottom-[calc(100%+8px)] left-0 w-full"
                            }`}
                          >
                            {/* Popover Header */}
                            <div className="mb-2.5 px-1 text-left">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                ANSH ECOSYSTEM
                              </p>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Jump to your other ANSH apps
                              </p>
                            </div>
                            
                            <div className="h-px bg-zinc-100 dark:bg-white/[0.05] mb-2" />

                            {/* Apps List */}
                            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-0.5">
                              {ECOSYSTEM_APPS.map((app) => {
                                const isCurrent = app.name === "ANSH Tasks";
                                return (
                                  <a
                                    key={app.name}
                                    href={isCurrent || app.status === "SOON" ? undefined : app.link}
                                    target={isCurrent || app.status === "SOON" ? undefined : "_blank"}
                                    rel="noopener noreferrer"
                                    onClick={() => setIsAppsOpen(false)}
                                    className={[
                                      "flex items-start gap-3 rounded-xl p-2 transition-all border",
                                      isCurrent
                                        ? "bg-emerald-50/70 dark:bg-emerald-950/15 border-emerald-100/50 dark:border-emerald-500/10 cursor-default"
                                        : app.status === "SOON"
                                          ? "opacity-60 cursor-not-allowed border-transparent hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]"
                                          : "hover:bg-zinc-50 dark:hover:bg-white/[0.03] cursor-pointer border-transparent"
                                    ].join(" ")}
                                  >
                                    {/* Status Dot */}
                                    <span
                                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                      style={{ backgroundColor: app.dotColor }}
                                    />

                                    {/* App Meta */}
                                    <div className="min-w-0 flex-1 text-left">
                                      <div className="flex items-center gap-1">
                                        <span className="font-heading text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                          {app.name}
                                        </span>
                                        {!isCurrent && app.status !== "SOON" && (
                                          <svg
                                            className="h-3 w-3 text-zinc-400 shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                          </svg>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight truncate">
                                        {app.subtext}
                                      </p>
                                    </div>

                                    {/* Status Badge */}
                                    <span className={`shrink-0 rounded-[6px] px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${
                                      isCurrent
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30"
                                        : app.status === "SOON"
                                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-950/30"
                                          : app.statusColor === "purple"
                                            ? "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-950/30"
                                            : app.statusColor === "blue"
                                              ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-950/30"
                                              : app.statusColor === "orange"
                                                ? "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-950/30"
                                                : app.statusColor === "green"
                                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30"
                                                  : app.statusColor === "pink"
                                                    ? "bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-950/30"
                                                    : "bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-950/20 dark:text-zinc-400 dark:border-zinc-950/30"
                                    }`}>
                                      {isCurrent ? "HERE" : app.status}
                                    </span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Link
                      href={href}
                      title={isSidebarCollapsed ? label : undefined}
                      onClick={(e) => {
                        if (!guardPathAccess(href)) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        if (!guardPlanPathAccess(href)) {
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
                          : "text-zinc-650 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100",
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
                  </Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Panel (Footer Options) */}
      <div className="shrink-0 border-t border-zinc-200/60 p-3 dark:border-white/[0.06]">
        {mounted && (
          isSidebarCollapsed ? (
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
          )
        )}
      </div>
    </aside>
  );
}
