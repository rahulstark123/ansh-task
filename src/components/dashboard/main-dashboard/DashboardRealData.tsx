"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  FolderIcon,
  CheckCircleIcon,
  TicketIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  SparklesIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";

// Types corresponding to Prisma Schema
interface Project {
  id: string;
  name: string;
  description?: string;
  progress: number;
  startDate: string;
  due: string;
  priority: "Urgent" | "High" | "Normal" | "Low";
  status: "Discovery" | "Planning" | "Active" | "Review" | "Completed" | "On Hold";
  health: "good" | "warn" | "danger" | "neutral";
  owner: string;
  estimatedHours: number;
  category: string;
  members: string[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  due: string;
  priority: "low" | "medium" | "high";
  category?: string;
  assignee?: string;
  status: "todo" | "in_progress" | "on_hold" | "blocked" | "done";
  estimate?: string;
  done: boolean;
  projectId?: string;
  project?: { name: string };
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  jobTitle?: string;
  department?: string;
  tasks?: { id: string; title: string; status: string }[];
}

export function DashboardRealData() {
  const layoutId = useId();
  
  // Loading & State
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number>(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Hover states for interactive charts
  const [hoveredPriority, setHoveredPriority] = useState<string | null>(null);

  // Fetch DB data on mount
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "";
      setUserEmail(email);

      const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid");
      const wid = onboardingWid ? parseInt(onboardingWid, 10) : 1;
      setActiveWorkspaceId(wid);

      // Fetch projects, tasks, tickets, and team members in parallel
      const [projRes, taskRes, tickRes, teamRes] = await Promise.all([
        fetch(`/api/project?wid=${wid}&email=${encodeURIComponent(email)}`),
        fetch(`/api/task?wid=${wid}&email=${encodeURIComponent(email)}`),
        fetch(`/api/support?wid=${wid}`),
        fetch(`/api/team?email=${encodeURIComponent(email)}&wid=${wid}`),
      ]);

      const [projData, taskData, tickData, teamData] = await Promise.all([
        projRes.json(),
        taskRes.json(),
        tickRes.json(),
        teamRes.json(),
      ]);

      if (projData.success) setProjects(projData.projects || []);
      if (taskData.success) setTasks(taskData.tasks || []);
      if (tickData.success) setTickets(tickData.tickets || []);
      if (teamData.success) setMembers(teamData.members || []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Helper formatting styles
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/30 dark:text-rose-350 dark:border-rose-900/40";
      case "medium":
      case "normal":
        return "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-350 dark:border-amber-900/40";
      case "low":
        return "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/40";
      default:
        return "bg-zinc-50 text-zinc-650 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-350 dark:border-zinc-700";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "done":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-350 dark:border-emerald-900/40";
      case "in_progress":
      case "active":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-350 dark:border-sky-900/40";
      case "blocked":
      case "on hold":
      case "on_hold":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-350 dark:border-rose-900/40";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
    }
  };

  const getHealthDotColor = (health: string) => {
    switch (health.toLowerCase()) {
      case "good":
        return "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]";
      case "warn":
        return "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.28)]";
      case "danger":
        return "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.25)]";
      default:
        return "bg-zinc-450 shadow-[0_0_0_4px_rgba(156,163,175,0.25)] dark:bg-zinc-600";
    }
  };

  // Memoized basic stats calculations
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const avgProgress = totalProjects
      ? Math.round(projects.reduce((acc, curr) => acc + curr.progress, 0) / totalProjects)
      : 0;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const openTickets = tickets.filter((t) => t.status !== "Closed" && t.status !== "Resolved").length;
    const totalMembers = members.length;

    return {
      totalProjects,
      avgProgress,
      totalTasks,
      completedTasks,
      completionRate,
      openTickets,
      totalMembers,
    };
  }, [projects, tasks, tickets, members]);

  // Memoized advanced data structures
  const advancedData = useMemo(() => {
    // 1. Task Priority Counts
    const prioCounts = { low: 0, medium: 0, high: 0 };
    tasks.forEach((t) => {
      const p = t.priority?.toLowerCase() as keyof typeof prioCounts;
      if (prioCounts[p] !== undefined) {
        prioCounts[p]++;
      } else {
        prioCounts.medium++; // default fallback
      }
    });

    // 2. Team Workload (Task count per member email/name)
    const workloadMap: Record<string, { count: number; name: string; title: string }> = {};
    
    // Initialize with existing team members
    members.forEach((m) => {
      const name = `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email.split("@")[0];
      workloadMap[name.toLowerCase()] = {
        count: 0,
        name,
        title: m.jobTitle || "Team Member",
      };
    });

    let unassignedCount = 0;
    tasks.forEach((t) => {
      if (t.assignee) {
        const assigneeKey = t.assignee.toLowerCase();
        if (workloadMap[assigneeKey]) {
          workloadMap[assigneeKey].count++;
        } else {
          // If assignee doesn't match members list directly, store or add dynamically
          workloadMap[assigneeKey] = {
            count: 1,
            name: t.assignee,
            title: "Contributor",
          };
        }
      } else {
        unassignedCount++;
      }
    });

    const workloads = Object.values(workloadMap).sort((a, b) => b.count - a.count);
    if (unassignedCount > 0) {
      workloads.push({ count: unassignedCount, name: "Unassigned", title: "Open Queue" });
    }

    // 3. Project Health metrics
    const healthCounts = { good: 0, warn: 0, danger: 0, neutral: 0 };
    projects.forEach((p) => {
      const h = p.health?.toLowerCase() as keyof typeof healthCounts;
      if (healthCounts[h] !== undefined) {
        healthCounts[h]++;
      } else {
        healthCounts.neutral++;
      }
    });

    // 4. Ticket Category counts
    const ticketCatCounts: Record<string, number> = {};
    tickets.forEach((t) => {
      const cat = t.category || "Technical";
      ticketCatCounts[cat] = (ticketCatCounts[cat] || 0) + 1;
    });

    // 5. Tasks done/pending per project
    const projectTaskBreakdown = projects.map((p) => {
      const projTasks = tasks.filter((t) => t.projectId === p.id);
      const done = projTasks.filter((t) => t.status === "done").length;
      const pending = projTasks.length - done;
      return {
        name: p.name,
        done,
        pending,
        total: projTasks.length,
        progress: p.progress,
      };
    });

    // 6. Tasks status Breakdown
    const statusCounts = { todo: 0, in_progress: 0, blocked: 0, done: 0 };
    tasks.forEach((t) => {
      const s = t.status === "on_hold" || t.status === "blocked" ? "blocked" : t.status;
      if (statusCounts[s as keyof typeof statusCounts] !== undefined) {
        statusCounts[s as keyof typeof statusCounts]++;
      }
    });

    return {
      prioCounts,
      workloads,
      healthCounts,
      ticketCatCounts,
      projectTaskBreakdown,
      statusCounts,
    };
  }, [projects, tasks, tickets, members]);

  if (loading) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center">
        <ArrowPathIcon className="h-10 w-10 animate-spin text-[var(--app-primary)]" />
        <span className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Gathering database analytics...
        </span>
      </div>
    );
  }

  // Priorities list for Priority Donut
  const priorityList = [
    { key: "high", label: "High", count: advancedData.prioCounts.high, color: "#f43f5e" },
    { key: "medium", label: "Medium", count: advancedData.prioCounts.medium, color: "#fbbf24" },
    { key: "low", label: "Low", count: advancedData.prioCounts.low, color: "#0d9488" },
  ];
  const totalPrioCount = priorityList.reduce((acc, curr) => acc + curr.count, 0) || 1;

  // Render priority donut stroke values
  let accumulatedPercent = 0;

  return (
    <div className="space-y-8">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION: BASIC METRICS CARD GRID                                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Projects */}
        <div className="app-hover-lift rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[var(--app-primary)] dark:bg-teal-950/45 dark:text-teal-400">
              <FolderIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Portfolio
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {stats.totalProjects}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Active Projects · {stats.avgProgress}% avg progress
            </p>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--app-gradient-from)] to-[var(--app-gradient-to)]"
              style={{ width: `${stats.avgProgress}%` }}
            />
          </div>
        </div>

        {/* Card 2: Tasks */}
        <div className="app-hover-lift rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-650 dark:bg-sky-950/45 dark:text-sky-400">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Tasks
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {stats.completedTasks}
              <span className="text-lg font-semibold text-zinc-450 dark:text-zinc-500">
                /{stats.totalTasks}
              </span>
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Completed Tasks · {stats.completionRate}% completion rate
            </p>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: Support Tickets */}
        <div className="app-hover-lift rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/45 dark:text-rose-450">
              <TicketIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Support
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {stats.openTickets}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Open Tickets · requires resolution
            </p>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
            <SignalIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Connected to Helpdesk API</span>
          </div>
        </div>

        {/* Card 4: Team Directory */}
        <div className="app-hover-lift rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/45 dark:text-purple-400">
              <UserGroupIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Directory
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {stats.totalMembers}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Active Team Members · {members.filter((m) => m.department === "Engineering").length} engineers
            </p>
          </div>
          <div className="mt-3.5 flex -space-x-1.5 overflow-hidden">
            {members.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-zinc-200 text-[8px] font-black text-zinc-700 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-200"
              >
                {(member.firstName ? member.firstName[0] : member.email[0]).toUpperCase()}
              </div>
            ))}
            {stats.totalMembers > 4 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-zinc-150 text-[8px] font-black text-zinc-650 dark:border-zinc-900 dark:bg-zinc-800 dark:text-zinc-400">
                +{stats.totalMembers - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION: BASIC TABLES (RECENT TASKS & ACTIVE PROJECTS)            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Tasks Table */}
        <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/[0.05]">
            <div>
              <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Recent Tasks
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                The latest assignments created in the workspace
              </p>
            </div>
            <Link
              href="/tasks"
              className="group inline-flex items-center gap-1 text-[11px] font-bold text-[var(--app-primary)] hover:underline"
            >
              All tasks
              <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            {tasks.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                <CheckCircleIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                <span className="mt-2 text-xs font-semibold">No tasks found. Create one to get started!</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-450 dark:border-white/[0.05] dark:bg-zinc-950/20">
                    <th className="px-5 py-2.5">Task</th>
                    <th className="px-5 py-2.5">Assignee</th>
                    <th className="px-5 py-2.5">Priority</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/80 dark:divide-white/[0.04]">
                  {tasks.slice(0, 5).map((task) => (
                    <tr
                      key={task.id}
                      className="group text-xs transition-colors hover:bg-zinc-50/40 dark:hover:bg-white/[0.015]"
                    >
                      <td className="px-5 py-3">
                        <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]" title={task.title}>
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-450 dark:text-zinc-500">
                          {task.project?.name || "General Work"}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-zinc-550 dark:text-zinc-400 font-semibold">
                        {task.assignee || <span className="text-zinc-350 italic">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                          {task.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Active Projects Table/List */}
        <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/[0.05]">
            <div>
              <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Active Projects
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Status tracker for your active initiatives
              </p>
            </div>
            <Link
              href="/projects"
              className="group inline-flex items-center gap-1 text-[11px] font-bold text-[var(--app-primary)] hover:underline"
            >
              All projects
              <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="flex-1 p-5 space-y-4">
            {projects.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                <FolderIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                <span className="mt-2 text-xs font-semibold">No active projects yet. Add one!</span>
              </div>
            ) : (
              projects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-zinc-100 bg-zinc-50/40 p-3.5 transition-all hover:bg-zinc-50 dark:border-white/5 dark:bg-zinc-950/20 dark:hover:bg-zinc-950/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${getHealthDotColor(project.health)}`} />
                        <h4 className="truncate font-heading text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {project.name}
                        </h4>
                      </div>
                      <p className="mt-1 text-[10px] font-medium text-zinc-450 dark:text-zinc-500">
                        Lead: {project.owner} · Category: {project.category}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-zinc-700 dark:text-zinc-200">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-150 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[var(--app-primary)]"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION: ADVANCED ANALYTICS BUTTON & TOGGLE PANEL                 */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center py-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-hover)] px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:brightness-110 active:scale-95 cursor-pointer"
        >
          <SparklesIcon className="h-4.5 w-4.5 animate-pulse text-teal-200" />
          <span>{showAdvanced ? "Hide Advanced Analytics" : "Show Advanced Analytics"}</span>
          {showAdvanced ? (
            <ChevronUpIcon className="h-4 w-4 shrink-0 transition-transform" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform group-hover:translate-y-0.5" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
              
              {/* Chart 1: Priority Distribution (SVG Donut Chart) */}
              <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
                <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  Task Priority Allocation
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-5">
                  Proportion of task urgencies assigned in this workspace
                </p>

                {totalPrioCount === 0 || tasks.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-xs italic text-zinc-450">
                    Create tasks to generate priority breakdowns.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                    {/* SVG Donut */}
                    <div className="relative h-32 w-32 shrink-0">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="rgba(148,163,184,0.15)"
                          strokeWidth="11"
                        />
                        {priorityList.map((p) => {
                          const percent = (p.count / totalPrioCount) * 100;
                          const circumference = 2 * Math.PI * 40; // ~251.32
                          const strokeLength = (percent / 100) * circumference;
                          const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;
                          
                          // Track accumulation
                          accumulatedPercent += percent;

                          const isHovered = hoveredPriority === p.key;

                          return (
                            <motion.circle
                              key={p.key}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={p.color}
                              strokeWidth={isHovered ? 13 : 11}
                              strokeDasharray={`${strokeLength} ${circumference}`}
                              strokeDashoffset={strokeOffset}
                              strokeLinecap="round"
                              transition={{ duration: 0.3 }}
                              onMouseEnter={() => setHoveredPriority(p.key)}
                              onMouseLeave={() => setHoveredPriority(null)}
                              className="cursor-pointer transition-all"
                            />
                          );
                        })}
                      </svg>
                      {/* Inner circle text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                          {tasks.length}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                          Tasks
                        </span>
                      </div>
                    </div>

                    {/* Legends */}
                    <div className="flex-1 space-y-3.5 w-full">
                      {priorityList.map((p) => {
                        const pct = Math.round((p.count / totalPrioCount) * 100);
                        const isHovered = hoveredPriority === p.key;
                        return (
                          <div
                            key={p.key}
                            onMouseEnter={() => setHoveredPriority(p.key)}
                            onMouseLeave={() => setHoveredPriority(null)}
                            className={`flex items-center justify-between rounded-xl px-3 py-1.5 border transition-all ${
                              isHovered 
                                ? "bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-white/10" 
                                : "bg-transparent border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                                {p.label}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">
                                {p.count}
                              </span>
                              <span className="ml-1.5 text-[10px] font-semibold text-zinc-400">
                                ({pct}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Chart 2: Team Workload (Horizontal SVG Bars) */}
              <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
                <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  Team Task Workload
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-5">
                  Number of tasks currently allocated to each team member
                </p>

                {advancedData.workloads.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-xs italic text-zinc-450">
                    Add team members to display workloads.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                    {advancedData.workloads.map((w, index) => {
                      const maxTasks = Math.max(...advancedData.workloads.map((wl) => wl.count), 1);
                      const barPercent = Math.max(6, (w.count / maxTasks) * 100);
                      return (
                        <div key={index} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-zinc-800 dark:text-zinc-150">
                                {w.name}
                              </span>
                              <span className="ml-2 text-[10px] text-zinc-400">
                                {w.title}
                              </span>
                            </div>
                            <span className="font-black text-zinc-950 dark:text-zinc-50">
                              {w.count} {w.count === 1 ? "task" : "tasks"}
                            </span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barPercent}%` }}
                              transition={{ duration: 0.6, delay: index * 0.05 }}
                              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 dark:from-teal-500 dark:to-teal-700"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chart 3: Project Completion Rates (Task stack breakdown) */}
              <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
                <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  Project Tasks Completion Depth
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-5">
                  Comparison of completed vs pending tasks for active projects
                </p>

                {advancedData.projectTaskBreakdown.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-xs italic text-zinc-450">
                    No active projects to analyze tasks counts.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                    {advancedData.projectTaskBreakdown.map((proj, idx) => {
                      const donePct = proj.total ? (proj.done / proj.total) * 100 : 0;
                      const pendPct = proj.total ? (proj.pending / proj.total) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-800 dark:text-zinc-150 truncate max-w-[200px]" title={proj.name}>
                              {proj.name}
                            </span>
                            <span className="font-black text-zinc-900 dark:text-zinc-550 text-[10px]">
                              {proj.done} Done / {proj.pending} Pending ({proj.total} total)
                            </span>
                          </div>
                          
                          {proj.total === 0 ? (
                            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/85 flex items-center justify-center">
                              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">No Tasks Wired</span>
                            </div>
                          ) : (
                            <div className="h-3.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
                              {proj.done > 0 && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${donePct}%` }}
                                  transition={{ duration: 0.6 }}
                                  className="h-full bg-emerald-500"
                                  title={`Completed: ${proj.done}`}
                                />
                              )}
                              {proj.pending > 0 && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pendPct}%` }}
                                  transition={{ duration: 0.6 }}
                                  className="h-full bg-zinc-300 dark:bg-zinc-650"
                                  title={`Pending: ${proj.pending}`}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chart 4: Support Helpdesk Category Breakdown */}
              <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
                <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  Ticket Category & Severity
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-5">
                  Breakdown of customer tickets by department and categories
                </p>

                {tickets.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-xs italic text-zinc-450">
                    No support tickets logged in this workspace yet.
                  </div>
                ) : (
                  <div className="flex flex-col justify-center h-full gap-5">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(advancedData.ticketCatCounts).map(([cat, count], idx) => {
                        const maxCount = Math.max(...Object.values(advancedData.ticketCatCounts), 1);
                        const scalePercent = (count / maxCount) * 100;
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-white/5 dark:bg-zinc-950/20"
                          >
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {cat}
                            </p>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                                {count}
                              </span>
                              <span className="text-[9px] font-semibold text-zinc-450">
                                {count === 1 ? "ticket" : "tickets"}
                              </span>
                            </div>
                            <div className="mt-2.5 h-1 w-full bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full"
                                style={{ width: `${scalePercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Open tickets by priority summary */}
                    <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs dark:border-white/10">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">
                        Helpdesk Priority Statuses
                      </p>
                      <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-wider">
                        <div className="rounded-lg bg-rose-50/50 py-1.5 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450">
                          <span>
                            {tickets.filter((t) => t.priority.toLowerCase() === "high").length} High
                          </span>
                        </div>
                        <div className="rounded-lg bg-amber-50/50 py-1.5 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                          <span>
                            {tickets.filter((t) => t.priority.toLowerCase() === "medium" || t.priority.toLowerCase() === "normal").length} Medium
                          </span>
                        </div>
                        <div className="rounded-lg bg-teal-50/50 py-1.5 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400">
                          <span>
                            {tickets.filter((t) => t.priority.toLowerCase() === "low").length} Low
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart 5: Tasks Status Breakdown (Radial Rings) */}
              <div className="flex flex-col md:col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900/40">
                <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  Task Status Distribution Rings
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-6">
                  Workspace status ratios displaying engineering and project load states
                </p>

                {tasks.length === 0 ? (
                  <div className="flex h-44 items-center justify-center text-xs italic text-zinc-450">
                    No task records to generate completion states.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {/* Ring calculations */}
                    {[
                      { key: "todo", label: "To Do", count: advancedData.statusCounts.todo, colorClass: "stroke-zinc-400 dark:stroke-zinc-500", colorText: "text-zinc-500" },
                      { key: "in_progress", label: "In Progress", count: advancedData.statusCounts.in_progress, colorClass: "stroke-sky-500", colorText: "text-sky-500" },
                      { key: "blocked", label: "Blocked/On Hold", count: advancedData.statusCounts.blocked, colorClass: "stroke-rose-500", colorText: "text-rose-500" },
                      { key: "done", label: "Completed", count: advancedData.statusCounts.done, colorClass: "stroke-emerald-500", colorText: "text-emerald-500" },
                    ].map((state) => {
                      const pct = Math.round((state.count / tasks.length) * 100) || 0;
                      const radius = 30;
                      const circ = 2 * Math.PI * radius; // ~188.5
                      const offset = circ - (pct / 100) * circ;

                      return (
                        <div
                          key={state.key}
                          className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/20 p-4 dark:border-white/5 dark:bg-zinc-950/10"
                        >
                          <div className="relative h-20 w-20 shrink-0">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                              <circle
                                cx="40"
                                cy="40"
                                r={radius}
                                fill="transparent"
                                stroke="rgba(148,163,184,0.12)"
                                strokeWidth="6"
                              />
                              <motion.circle
                                cx="40"
                                cy="40"
                                r={radius}
                                fill="transparent"
                                className={state.colorClass}
                                strokeWidth="6"
                                strokeDasharray={circ}
                                initial={{ strokeDashoffset: circ }}
                                animate={{ strokeDashoffset: offset }}
                                transition={{ duration: 0.85, ease: "easeOut" }}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                                {pct}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                              {state.label}
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold text-zinc-400">
                              {state.count} {state.count === 1 ? "task" : "tasks"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
