"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  MagnifyingGlassIcon, 
  FolderIcon,
  ClipboardDocumentIcon,
  UserIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  MoonIcon,
  SunIcon,
  SparklesIcon,
  ArrowLeftOnRectangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useAppearance } from "@/context/AppearanceContext";
import { supabase } from "@/lib/supabase";

type SearchItem = {
  id: string;
  type: "page" | "project" | "task" | "member" | "action";
  title: string;
  subtitle?: string;
  action: () => void;
};

export function AppTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { setIsAppearanceOpen } = useAppearance();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [userInitial, setUserInitial] = useState("A");

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          const res = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
          const json = await res.json();
          let name = user.user_metadata?.full_name || user.email.split("@")[0];
          let avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`;
          
          if (json.success && json.user) {
            const u = json.user;
            name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || name;
            avatar = u.avatar || avatar;
          }

          setUserInfo({
            name,
            email: user.email,
            avatar,
          });

          const initials = name
            .trim()
            .split(/\s+/)
            .map((n: string) => n[0])
            .join("")
            .toUpperCase();
          if (initials) {
            setUserInitial(initials.slice(0, 2));
          }
        }
      } catch (err) {
        console.error("Error fetching user in AppTopBar:", err);
      }
    }
    fetchUser();
  }, []);

  // Global trigger keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const searchItems: SearchItem[] = [
    // Navigation Pages
    { id: "p-dash", type: "page", title: "Go to Dashboard", subtitle: "Main analytics & overview", action: () => { router.push("/dashboard"); setIsOpen(false); } },
    { id: "p-tasks", type: "page", title: "Go to Task List", subtitle: "Complete tasks backlog", action: () => { router.push("/tasks"); setIsOpen(false); } },
    { id: "p-mytasks", type: "page", title: "Go to My Tasks", subtitle: "Your assigned workload list", action: () => { router.push("/tasks/my"); setIsOpen(false); } },
    { id: "p-team", type: "page", title: "Go to Team Space", subtitle: "Discussions & updates board", action: () => { router.push("/tasks/team"); setIsOpen(false); } },
    { id: "p-proj", type: "page", title: "Go to Projects", subtitle: "List of active portfolio projects", action: () => { router.push("/projects"); setIsOpen(false); } },
    { id: "p-bb", type: "page", title: "Go to Brain Board", subtitle: "Sticky canvas ideas mapping", action: () => { router.push("/brain-board"); setIsOpen(false); } },
    { id: "p-teams", type: "page", title: "Go to Teams Management", subtitle: "Add and manage team members", action: () => { router.push("/management/teams"); setIsOpen(false); } },
    { id: "p-settings", type: "page", title: "Go to Settings", subtitle: "Workspace configuration drawer", action: () => { router.push("/settings"); setIsOpen(false); } },
    
    // Core Projects
    { id: "pr-1", type: "project", title: "Project: ANSH Task — Core platform", subtitle: "Engineering · 68% complete", action: () => { router.push("/projects"); setIsOpen(false); } },
    { id: "pr-2", type: "project", title: "Project: Enterprise rollout & SSO", subtitle: "Security · 41% complete", action: () => { router.push("/projects"); setIsOpen(false); } },
    { id: "pr-3", type: "project", title: "Project: Brain board beta", subtitle: "Product · 22% complete", action: () => { router.push("/projects"); setIsOpen(false); } },
    { id: "pr-4", type: "project", title: "Project: Billing System Migration", subtitle: "Operations · 5% complete", action: () => { router.push("/projects"); setIsOpen(false); } },
    { id: "pr-5", type: "project", title: "Project: Mobile App Re-architecture", subtitle: "Engineering · 89% complete", action: () => { router.push("/projects"); setIsOpen(false); } },

    // Core Tasks
    { id: "t-1", type: "task", title: "Task: Review product brief with design team", subtitle: "High Priority · Product", action: () => { router.push("/tasks"); setIsOpen(false); } },
    { id: "t-2", type: "task", title: "Task: Draft weekly update for stakeholders", subtitle: "Medium Priority · Operations", action: () => { router.push("/tasks"); setIsOpen(false); } },
    { id: "t-3", type: "task", title: "Task: Organize ANSH Task backlog labels", subtitle: "Completed · Engineering", action: () => { router.push("/tasks"); setIsOpen(false); } },
    { id: "t-4", type: "task", title: "Task: Bug: Session timeout on refresh", subtitle: "High Priority · Engineering", action: () => { router.push("/tasks"); setIsOpen(false); } },
    { id: "t-5", type: "task", title: "Task: Create interactive landing page mockup", subtitle: "High Priority · Design", action: () => { router.push("/tasks"); setIsOpen(false); } },
    { id: "t-6", type: "task", title: "Task: Migrate database seeding scripts", subtitle: "Normal Priority · Engineering", action: () => { router.push("/tasks"); setIsOpen(false); } },

    // Team Members
    { id: "m-1", type: "member", title: "Member: Aisha Khan", subtitle: "Workspace Admin · Lead Engineer", action: () => { router.push("/management/teams"); setIsOpen(false); } },
    { id: "m-2", type: "member", title: "Member: Leo Park", subtitle: "Lead Designer", action: () => { router.push("/management/teams"); setIsOpen(false); } },
    { id: "m-3", type: "member", title: "Member: Sam Rivera", subtitle: "Product Manager", action: () => { router.push("/management/teams"); setIsOpen(false); } },
    { id: "m-4", type: "member", title: "Member: Marcus Vance", subtitle: "Operations Manager", action: () => { router.push("/management/teams"); setIsOpen(false); } },
    { id: "m-5", type: "member", title: "Member: Priya Sharma", subtitle: "QA Engineer", action: () => { router.push("/management/teams"); setIsOpen(false); } },
    { id: "m-6", type: "member", title: "Member: Yuki Tanaka", subtitle: "Frontend Dev", action: () => { router.push("/management/teams"); setIsOpen(false); } },

    // Quick Actions
    { id: "a-theme", type: "action", title: "Customize Theme & Accents", subtitle: "Open workspace appearance controls", action: () => { setIsAppearanceOpen(true); setIsOpen(false); } },
    { id: "a-dark", type: "action", title: "Switch to Dark Mode", subtitle: "Set application color scheme", action: () => { setTheme("dark"); setIsOpen(false); } },
    { id: "a-light", type: "action", title: "Switch to Light Mode", subtitle: "Set application color scheme", action: () => { setTheme("light"); setIsOpen(false); } },
    { id: "a-system", type: "action", title: "Use System Default Theme", subtitle: "Sync with local OS layout theme", action: () => { setTheme("system"); setIsOpen(false); } },
  ];

  // Filter items based on user search query
  const filtered = searchItems.filter(item => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) || 
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.type.toLowerCase().includes(q)
    );
  });

  // Modal keyboard navigation listener
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev === filtered.length - 1 ? 0 : prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev === 0 ? filtered.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeEl = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const getItemIcon = (type: SearchItem["type"]) => {
    switch (type) {
      case "page": return <GlobeAltIcon className="h-4.5 w-4.5 text-indigo-500" />;
      case "project": return <FolderIcon className="h-4.5 w-4.5 text-amber-500" />;
      case "task": return <ClipboardDocumentIcon className="h-4.5 w-4.5 text-emerald-500" />;
      case "member": return <UserIcon className="h-4.5 w-4.5 text-pink-500" />;
      case "action": return <SparklesIcon className="h-4.5 w-4.5 text-purple-500" />;
      default: return <Cog6ToothIcon className="h-4.5 w-4.5 text-zinc-500" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[3.75rem] shrink-0 items-center justify-between gap-4 border-b border-zinc-300/80 bg-[var(--background)]/85 px-5 backdrop-blur-sm dark:border-white/[0.06] dark:bg-zinc-950/75">
        
        {/* Trigger Search Bar */}
        <div 
          onClick={() => setIsOpen(true)}
          className="group relative max-w-md flex-1 cursor-pointer"
        >
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3.5 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-zinc-400 transition-colors group-hover:text-[var(--app-primary)]" />
          <input
            type="text"
            placeholder="Search... (Ctrl + K)"
            readOnly
            className="w-full cursor-pointer rounded-xl border border-zinc-200/90 bg-white/80 py-2 pr-14 pl-10 text-xs font-semibold text-zinc-600 shadow-[0_1px_0_rgba(0,0,0,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-350 dark:placeholder:text-zinc-500"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 border border-zinc-200/60 dark:bg-zinc-800 dark:border-white/5 dark:text-zinc-500">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Profile Popover Menu */}
          <div 
            className="relative" 
            onMouseEnter={() => setIsProfileCardOpen(true)} 
            onMouseLeave={() => setIsProfileCardOpen(false)}
          >
            <button 
              onClick={() => setIsProfileCardOpen(!isProfileCardOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--app-gradient-from)] to-[var(--app-gradient-to)] text-[11px] font-semibold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 cursor-pointer overflow-hidden outline-none"
            >
              {userInfo?.avatar ? (
                <img src={userInfo.avatar} alt={userInfo.name} className="h-full w-full object-cover" />
              ) : (
                userInitial
              )}
            </button>

            <AnimatePresence>
              {isProfileCardOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2.5 w-64 z-50 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#121418] text-left"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-white/[0.04]">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[var(--app-gradient-from)] to-[var(--app-gradient-to)] flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                      {userInfo?.avatar ? (
                        <img src={userInfo.avatar} alt={userInfo.name} className="h-full w-full object-cover" />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">
                        {userInfo?.name || "ANSH User"}
                      </h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {userInfo?.email || ""}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2.5 space-y-1">
                    <Link
                      href="/settings/profile"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-zinc-400" />
                      Manage Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <Cog6ToothIcon className="h-4 w-4 text-zinc-400" />
                      Workspace Settings
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={async () => {
              setIsLoggingOut(true);
              setTimeout(async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }, 1200);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/90 bg-white/90 text-rose-600 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:border-rose-300 hover:bg-rose-50 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer"
            title="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* GLOBAL SEARCH COMMAND MENU MODAL */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-md dark:bg-black/50"
            />

            {/* Command Menu Wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.25 }}
              className="fixed inset-x-4 top-20 z-50 mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121418] overflow-hidden"
              onKeyDown={handleModalKeyDown}
            >
              {/* Input Header */}
              <div className="relative border-b border-zinc-150 p-4 dark:border-white/5 flex items-center">
                <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400 mr-3 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Type a command, project, task or member..."
                  className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                />
                
                <span className="ml-2 rounded border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 dark:border-white/10 dark:bg-zinc-900">
                  ESC
                </span>
              </div>

              {/* Matching items results */}
              <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400 italic">
                    No results found matching "{query}"
                  </div>
                ) : (
                  <div ref={resultsRef} className="space-y-0.5">
                    {filtered.map((item, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 transition-colors ${
                            isSelected
                              ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                              : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm ${
                              isSelected 
                                ? "bg-white border-[var(--app-primary-soft-border)] dark:bg-zinc-900" 
                                : "bg-zinc-50/50 border-zinc-100 dark:bg-zinc-800/40 dark:border-white/5"
                            }`}>
                              {getItemIcon(item.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className={`text-[10px] truncate ${
                                  isSelected ? "text-[var(--app-primary-soft-text)]/80" : "text-zinc-450 dark:text-zinc-500"
                                }`}>
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Navigation Indicator / Hint */}
                          {isSelected && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--app-primary-soft-text)]/70 bg-[var(--app-primary)]/10 dark:bg-teal-500/20 px-2 py-0.5 rounded">
                              Jump to ↵
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Keyboard status bar */}
              <div className="flex justify-between items-center border-t border-zinc-150 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/30 dark:border-white/5 text-[9px] font-bold text-zinc-450 uppercase tracking-widest shrink-0">
                <div className="flex gap-4">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                </div>
                <span>Ctrl K to toggle</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Loader Modal */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-zinc-900/90 p-8 text-center shadow-2xl backdrop-blur-xl"
            >
              <div className="flex justify-center mb-6">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-450">
                  <ArrowPathIcon className="h-6 w-6 animate-spin" />
                </div>
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-2">Signing out</h3>
              <p className="text-xs text-zinc-450">Clearing your workspace session...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
