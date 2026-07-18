"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TEAM_SPACE_ENABLED } from "@/config/features";
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
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  TicketIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { useAppearance } from "@/context/AppearanceContext";
import { supabase } from "@/lib/supabase";
import { usePermissionAccess } from "@/lib/usePermissionAccess";
import { useWorkspacePlan } from "@/lib/useWorkspacePlan";
import posthog from "@/lib/posthog-noop";

type SearchItem = {
  id: string;
  type: "page" | "project" | "task" | "member" | "action";
  title: string;
  subtitle?: string;
  action: () => void;
};

type AppNotification = {
  id: string;
  type: "task" | "project" | "ticket" | "message";
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
};

/** Set to true when notification bell UI is ready to ship. */
const SHOW_NOTIFICATION_BELL = false;

export function AppTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { setIsAppearanceOpen } = useAppearance();
  const { guardPathAccess } = usePermissionAccess();
  const { plan, isTrial, trialDaysLeft, isPlanExpiringSoon, planDaysLeft, hasScheduledPro, ready: planReady, guardPlanPathAccess } = useWorkspacePlan();

  const [aiCredits, setAiCredits] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const wid = typeof window !== "undefined" ? sessionStorage.getItem("ansh_onboarding_wid") ?? "1" : "1";
    
    async function fetchCredits() {
      try {
        const res = await fetch(`/api/ai/usage?wid=${wid}`);
        const json = await res.json();
        if (json.success && active) {
          setAiCredits(json.creditsRemaining);
        }
      } catch (err) {
        console.error("Failed to fetch AI credits in TopBar:", err);
      }
    }
    fetchCredits();

    const handleUpdate = () => {
      fetchCredits();
    };
    window.addEventListener("update-ai-credits", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("update-ai-credits", handleUpdate);
    };
  }, [pathname]);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "seed-1",
      type: "task",
      title: "Task Assigned",
      description: "Aisha Khan assigned task 'Review onboarding flow' to you.",
      time: "10m ago",
      read: false,
    },
    {
      id: "seed-2",
      type: "project",
      title: "Project Progress",
      description: "Project 'ANSH Task — Core platform' reached 68% completion.",
      time: "1h ago",
      read: false,
    },
    {
      id: "seed-3",
      type: "ticket",
      title: "New High Severity Ticket",
      description: "Ticket #TCK-392 'Database load spike' submitted.",
      time: "2h ago",
      read: true,
    },
  ]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [workspaceChannels, setWorkspaceChannels] = useState<{ id: string; name: string }[]>([]);

  // Refs for tracking values inside realtime subscriptions
  const workspaceMembersRef = useRef(workspaceMembers);
  const workspaceChannelsRef = useRef(workspaceChannels);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    workspaceMembersRef.current = workspaceMembers;
  }, [workspaceMembers]);

  useEffect(() => {
    workspaceChannelsRef.current = workspaceChannels;
  }, [workspaceChannels]);

  // Click outside to close notifications popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch workspace details and listen for real-time notifications
  useEffect(() => {
    let currentUserId: string | null = null;
    let channel: any = null;

    async function initializeRealtimeNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        currentUserId = user.id;

        const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid");
        const wid = onboardingWid ? parseInt(onboardingWid, 10) : 1;

        // Fetch team members
        const teamRes = await fetch(`/api/team?email=${encodeURIComponent(user.email || "")}&wid=${wid}`);
        const teamJson = await teamRes.json();
        let membersList: { id: string; name: string; email: string }[] = [];
        if (teamJson.success && teamJson.members) {
          membersList = teamJson.members.map((u: any) => ({
            id: u.id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0],
            email: u.email,
          }));
          setWorkspaceMembers(membersList);
        }

        // Fetch projects
        try {
          const projRes = await fetch(`/api/project?wid=${wid}&email=${encodeURIComponent(user.email || "")}`);
          const projJson = await projRes.json();
          if (projJson.success && projJson.projects) {
            setDbProjects(projJson.projects);
          }
        } catch (err) {
          console.error("Error fetching projects for search in TopBar:", err);
        }

        // Fetch tasks
        try {
          const taskRes = await fetch(`/api/task?wid=${wid}&email=${encodeURIComponent(user.email || "")}`);
          const taskJson = await taskRes.json();
          if (taskJson.success && taskJson.tasks) {
            setDbTasks(taskJson.tasks);
          }
        } catch (err) {
          console.error("Error fetching tasks for search in TopBar:", err);
        }

        // Fetch channels (Team Space only)
        let channelsList: { id: string; name: string }[] = [];
        if (TEAM_SPACE_ENABLED) {
          const channelRes = await fetch(`/api/channel?wid=${wid}`);
          const channelJson = await channelRes.json();
          if (channelJson.success && channelJson.channels) {
            channelsList = channelJson.channels.map((c: any) => ({
              id: c.id,
              name: c.name,
            }));
            setWorkspaceChannels(channelsList);
          }
        }

        // Set up global supabase changes listener
        let channelBuilder = supabase.channel("global-topbar-changes");

        if (TEAM_SPACE_ENABLED) {
          channelBuilder = channelBuilder.on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "Message" },
            async (payload) => {
              const newMessage = payload.new as any;
              if (newMessage.senderId === currentUserId) return;

              // Find sender name
              const sender = workspaceMembersRef.current.find((m) => m.id === newMessage.senderId);
              const senderName = sender ? sender.name : "A teammate";

              let description = "";
              if (newMessage.channelId) {
                const targetChan = workspaceChannelsRef.current.find((c) => c.id === newMessage.channelId);
                const chanName = targetChan ? `#${targetChan.name}` : "a channel";
                description = `${senderName} sent a message in ${chanName}: "${newMessage.content}"`;
              } else {
                description = `${senderName} sent you a direct message: "${newMessage.content}"`;
              }

              const newNotification: AppNotification = {
                id: newMessage.id,
                type: "message",
                title: "New Message",
                description,
                time: "Just now",
                read: false,
                link: "/tasks/team",
              };

              setNotifications((prev) => [newNotification, ...prev]);
            }
          );
        }

        channel = channelBuilder
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "Task" },
            async (payload) => {
              const eventType = payload.eventType;
              const newTask = payload.new as any;
              const oldTask = payload.old as any;
              let title = "";
              let description = "";

              if (eventType === "INSERT") {
                title = "Task Created";
                description = `New task '${newTask.title}' was added.`;
              } else if (eventType === "UPDATE") {
                title = "Task Updated";
                const statusChange = oldTask && oldTask.status !== newTask.status ? ` (Status: ${newTask.status})` : "";
                description = `Task '${newTask.title}' was updated${statusChange}.`;
              } else if (eventType === "DELETE") {
                title = "Task Deleted";
                description = `A task was removed from the workspace.`;
              } else {
                return;
              }

              const newNotification: AppNotification = {
                id: newTask?.id || crypto.randomUUID(),
                type: "task",
                title,
                description,
                time: "Just now",
                read: false,
                link: "/tasks",
              };

              setNotifications((prev) => [newNotification, ...prev]);
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "Project" },
            async (payload) => {
              const eventType = payload.eventType;
              const newProj = payload.new as any;
              let title = "";
              let description = "";

              if (eventType === "INSERT") {
                title = "Project Launched";
                description = `New project '${newProj.name}' was created.`;
              } else if (eventType === "UPDATE") {
                title = "Project Updated";
                description = `Project '${newProj.name}' was updated (Progress: ${newProj.progress}%).`;
              } else {
                return;
              }

              const newNotification: AppNotification = {
                id: newProj.id,
                type: "project",
                title,
                description,
                time: "Just now",
                read: false,
                link: "/projects",
              };

              setNotifications((prev) => [newNotification, ...prev]);
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "Ticket" },
            async (payload) => {
              const eventType = payload.eventType;
              const newTicket = payload.new as any;
              let title = "";
              let description = "";

              if (eventType === "INSERT") {
                title = "Ticket Submitted";
                description = `Ticket #${newTicket.ticketId} '${newTicket.subject}' submitted (Severity: ${newTicket.priority}).`;
              } else if (eventType === "UPDATE") {
                title = "Ticket Updated";
                description = `Ticket #${newTicket.ticketId} status changed to ${newTicket.status}.`;
              } else {
                return;
              }

              const newNotification: AppNotification = {
                id: newTicket.id,
                type: "ticket",
                title,
                description,
                time: "Just now",
                read: false,
                link: "/support",
              };

              setNotifications((prev) => [newNotification, ...prev]);
            }
          )
          .subscribe();

      } catch (err) {
        console.error("Error setting up realtime notifications in AppTopBar:", err);
      }
    }

    initializeRealtimeNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "message":
        return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
      case "task":
        return <ClipboardDocumentIcon className="h-4 w-4" />;
      case "project":
        return <FolderIcon className="h-4 w-4" />;
      case "ticket":
        return <TicketIcon className="h-4 w-4" />;
      default:
        return <BellIcon className="h-4 w-4" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; avatar: string; role: string } | null>(null);
  const [userInitial, setUserInitial] = useState("A");

  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [dbTasks, setDbTasks] = useState<any[]>([]);

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
          let role = "Editor";
          
          if (json.success && json.user) {
            const u = json.user;
            name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || name;
            avatar = u.avatar || avatar;
            const normalizedRole = (u.role || "editor").toString().toLowerCase();
            role =
              normalizedRole === "owner"
                ? "Owner"
                : normalizedRole === "admin"
                ? "Admin"
                : normalizedRole === "observer"
                ? "Observer"
                : "Editor";
          }

          setUserInfo({
            name,
            email: user.email,
            avatar,
            role,
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

  // Autofocus input when modal opens and refresh search items
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);

      async function refreshSearchItems() {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid");
          const wid = onboardingWid ? parseInt(onboardingWid, 10) : 1;

          // Fetch team members, projects, and tasks in parallel
          const [teamRes, projRes, taskRes] = await Promise.all([
            fetch(`/api/team?email=${encodeURIComponent(user.email || "")}&wid=${wid}`),
            fetch(`/api/project?wid=${wid}&email=${encodeURIComponent(user.email || "")}`),
            fetch(`/api/task?wid=${wid}&email=${encodeURIComponent(user.email || "")}`),
          ]);

          const [teamJson, projJson, taskJson] = await Promise.all([
            teamRes.json(),
            projRes.json(),
            taskRes.json(),
          ]);

          if (teamJson.success && teamJson.members) {
            const membersList = teamJson.members.map((u: any) => ({
              id: u.id,
              name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0],
              email: u.email,
            }));
            setWorkspaceMembers(membersList);
          }

          if (projJson.success && projJson.projects) {
            setDbProjects(projJson.projects);
          }

          if (taskJson.success && taskJson.tasks) {
            setDbTasks(taskJson.tasks);
          }
        } catch (err) {
          console.error("Error refreshing search items in AppTopBar:", err);
        }
      }
      refreshSearchItems();
    }
  }, [isOpen]);

  const guardedRoutePush = (path: string) => {
    if (!guardPathAccess(path)) return;
    if (!guardPlanPathAccess(path)) return;
    router.push(path);
    setIsOpen(false);
  };

  const searchItems: SearchItem[] = [
    // Navigation Pages
    { id: "p-dash", type: "page", title: "Go to Dashboard", subtitle: "Main analytics & overview", action: () => guardedRoutePush("/dashboard") },
    { id: "p-tasks", type: "page", title: "Go to Task List", subtitle: "Complete tasks backlog", action: () => guardedRoutePush("/tasks") },
    { id: "p-mytasks", type: "page", title: "Go to My Tasks", subtitle: "Your assigned workload list", action: () => guardedRoutePush("/tasks/my") },
    ...(TEAM_SPACE_ENABLED
      ? [{ id: "p-team", type: "page" as const, title: "Go to Team Space", subtitle: "Discussions & updates board", action: () => guardedRoutePush("/tasks/team") }]
      : [{ id: "p-activity", type: "page" as const, title: "Go to Activity Feed", subtitle: "Recent workspace updates", action: () => guardedRoutePush("/tasks/activity") }]),
    { id: "p-proj", type: "page", title: "Go to Projects", subtitle: "List of active portfolio projects", action: () => guardedRoutePush("/projects") },
    { id: "p-bb", type: "page", title: "Go to Brain Board", subtitle: "Sticky canvas ideas mapping", action: () => guardedRoutePush("/brain-board") },
    { id: "p-teams", type: "page", title: "Go to Teams Management", subtitle: "Add and manage team members", action: () => guardedRoutePush("/management/teams") },
    { id: "p-announcements", type: "page", title: "Go to Announcements", subtitle: "Workspace notices and pinned updates", action: () => guardedRoutePush("/management/announcements") },
    { id: "p-settings", type: "page", title: "Go to Settings", subtitle: "Workspace configuration drawer", action: () => guardedRoutePush("/settings") },
    
    // Core Projects (Dynamic from DB)
    ...dbProjects.map((p) => ({
      id: `db-pr-${p.id}`,
      type: "project" as const,
      title: `Project: ${p.name}`,
      subtitle: `${p.category || "General"} · ${p.progress || 0}% complete`,
      action: () => guardedRoutePush("/projects")
    })),

    // Core Tasks (Dynamic from DB)
    ...dbTasks.map((t) => ({
      id: `db-t-${t.id}`,
      type: "task" as const,
      title: `Task: ${t.title}`,
      subtitle: `${t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : "Normal"} Priority · ${t.category || "General"} · ${t.status || "Todo"}`,
      action: () => guardedRoutePush("/tasks")
    })),

    // Team Members (Dynamic from DB)
    ...workspaceMembers.map((m) => ({
      id: `db-m-${m.id}`,
      type: "member" as const,
      title: `Member: ${m.name}`,
      subtitle: m.email,
      action: () => guardedRoutePush("/management/teams")
    })),

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

        <div className="flex items-center gap-4.5">
          {/* Plan Status Badge */}
          {planReady && plan && (
            <Link
              href="/billing/app"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                isTrial || isPlanExpiringSoon
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/10 hover:brightness-110"
                  : plan === "pro"
                  ? "bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 text-white shadow-md shadow-teal-500/10 hover:brightness-110"
                  : "border border-zinc-200 bg-zinc-50/50 text-zinc-550 hover:bg-zinc-100 hover:text-zinc-700 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-300"
              }`}
            >
              {isTrial ? (
                <>
                  <SparklesIcon className="h-3 w-3 animate-pulse text-amber-100" />
                  Free Trial - {trialDaysLeft ?? 0}{" "}
                  {trialDaysLeft === 1 ? "day" : "days"} left
                </>
              ) : isPlanExpiringSoon ? (
                <>
                  <SparklesIcon className="h-3 w-3 animate-pulse text-amber-100" />
                  Plan expiring in {planDaysLeft ?? 0}{" "}
                  {planDaysLeft === 1 ? "day" : "days"} · Renew now
                </>
              ) : hasScheduledPro && plan === "pro" ? (
                <>
                  <SparklesIcon className="h-3 w-3 animate-pulse text-teal-200" />
                  PRO · Renewal scheduled
                </>
              ) : plan === "pro" ? (
                <>
                  <SparklesIcon className="h-3 w-3 animate-pulse text-teal-200" />
                  PRO
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-450 dark:bg-zinc-500" />
                  Free
                </>
              )}
            </Link>
          )}

          {/* AI Credits Badge */}
          {aiCredits !== null && (
            <Link
              href="/billing/ai-usage"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-indigo-250 bg-indigo-50/50 hover:bg-indigo-100/50 dark:border-indigo-500/20 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 px-3 text-[10px] font-black uppercase tracking-wider text-indigo-650 dark:text-indigo-400 transition-colors shadow-sm cursor-pointer"
              title="AI Credits Remaining"
            >
              <CpuChipIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>AI Credits: {aiCredits}</span>
            </Link>
          )}

          {/* Notification Bell Menu */}
          {SHOW_NOTIFICATION_BELL && (
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/90 bg-white/90 text-zinc-550 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-800/80 cursor-pointer outline-none ${
                isNotificationOpen ? "ring-2 ring-teal-500/20 border-teal-500/50 text-teal-600 dark:text-teal-400" : ""
              }`}
              title="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-teal-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:bg-teal-500 dark:ring-zinc-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2.5 w-80 z-50 rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#121418] flex flex-col text-left overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-zinc-900/10">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                        }}
                        className="text-[10px] font-extrabold text-teal-600 hover:text-teal-700 dark:text-teal-405 dark:hover:text-teal-300 transition-colors cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Body / List */}
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100 dark:divide-white/[0.04] scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 dark:bg-zinc-900/60 dark:text-zinc-500 mb-2">
                          <BellIcon className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-350">
                          All caught up!
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          You have no new notifications.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            // Mark as read
                            setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item));
                            if (n.link) {
                              if (!guardPathAccess(n.link)) return;
                              if (!guardPlanPathAccess(n.link)) return;
                              router.push(n.link);
                              setIsNotificationOpen(false);
                            }
                          }}
                          className={`flex items-start gap-3 p-3.5 hover:bg-zinc-50/80 dark:hover:bg-white/[0.01] transition-all cursor-pointer ${
                            !n.read ? "bg-teal-50/15 dark:bg-teal-500/[0.01]" : ""
                          }`}
                        >
                          {/* Notification icon */}
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm ${
                            !n.read 
                              ? "bg-teal-50 border-teal-100 text-teal-600 dark:bg-teal-950/20 dark:border-teal-900/30 dark:text-teal-400" 
                              : "bg-zinc-50 border-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:border-white/5 dark:text-zinc-500"
                          }`}>
                            {getNotificationIcon(n.type)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-1.5">
                              <p className={`text-[11px] font-bold truncate ${
                                !n.read ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                              }`}>
                                {n.title}
                              </p>
                              <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-[10px] leading-normal text-zinc-500 dark:text-zinc-400 mt-0.5 break-words font-medium">
                              {n.description}
                            </p>
                          </div>

                          {/* Unread indicator dot */}
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="flex items-center justify-center border-t border-zinc-100 dark:border-white/[0.04] py-2.5 bg-zinc-50/50 dark:bg-zinc-900/10">
                      <button
                        onClick={() => {
                          setNotifications([]);
                        }}
                        className="text-[10px] font-bold text-zinc-500 hover:text-zinc-650 dark:text-zinc-450 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        Clear all notifications
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}

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
                      <span className="mt-1 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-350">
                        {userInfo?.role || "Editor"}
                      </span>
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
                posthog.reset();
                await supabase.auth.signOut();
                router.push("/login");
              }, 1200);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/90 bg-white/90 text-rose-600 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:border-rose-300 hover:bg-rose-50 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
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
