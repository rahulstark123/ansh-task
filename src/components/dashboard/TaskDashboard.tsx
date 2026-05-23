"use client";

import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  TrashIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  CheckIcon,
  TableCellsIcon,
  ViewColumnsIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import type { NewTaskPayload, Task, TaskPriority, TaskStatus } from "@/types/task";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { useWorkspaceDefaultsStore } from "@/store/workspaceDefaultsStore";



/* ─── helpers ─────────────────────────────────────────────── */

function getWid(): number {
  if (typeof window === "undefined") return 1;
  return parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10);
}

/** Map a raw Prisma task row to the frontend Task shape */
function mapApiTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    due: t.due ?? "No date",
    priority: (t.priority as Task["priority"]) ?? "medium",
    category: t.category ?? undefined,
    labels: t.labels ?? [],
    assignee: t.assignee ?? undefined,
    status: (t.status as Task["status"]) ?? "todo",
    estimate: t.estimate ?? undefined,
    done: t.done ?? false,
  };
}

const COLUMNS: { id: TaskStatus; label: string; bg: string; dot: string; border: string; darkBorder: string }[] = [
  { id: "todo", label: "To Do", bg: "bg-zinc-100/70 dark:bg-zinc-900/30", dot: "bg-zinc-400", border: "border-zinc-200/80", darkBorder: "dark:border-white/[0.06]" },
  { id: "in_progress", label: "In Progress", bg: "bg-teal-50/40 dark:bg-teal-950/10", dot: "bg-teal-500", border: "border-teal-100", darkBorder: "dark:border-teal-900/20" },
  { id: "blocked", label: "Blocked", bg: "bg-rose-50/40 dark:bg-rose-950/10", dot: "bg-rose-500", border: "border-rose-100", darkBorder: "dark:border-rose-900/20" },
  { id: "done", label: "Done", bg: "bg-emerald-50/40 dark:bg-emerald-950/10", dot: "bg-emerald-500", border: "border-emerald-100", darkBorder: "dark:border-emerald-900/20" },
];

const CATEGORIES = ["Product", "Engineering", "Design", "Operations", "Marketing", "General"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
const ASSIGNEES = ["Unassigned", "Me", "Alex Rivera", "Jordan Lee", "Sam Chen"];
const ESTIMATES = ["1", "2", "3", "5", "8", "—"];
const ALL_LABELS = ["Bug", "Feature", "Improvement", "Docs", "Design", "Meeting"];

function priorityColor(p: TaskPriority) {
  if (p === "high") return "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40";
  if (p === "medium") return "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40";
  return "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40";
}

function priorityDot(p: TaskPriority) {
  if (p === "high") return "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]";
  if (p === "medium") return "bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]";
  return "bg-emerald-400/90 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]";
}

// Custom letter avatars with vibrant distinct colors
function getAvatar(name: string) {
  if (!name || name === "Unassigned") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-650 dark:bg-zinc-800 dark:text-zinc-450" title="Unassigned">
        <UserIcon className="h-3 w-3" />
      </div>
    );
  }
  const initials = name === "Me" ? "ME" : name.trim().split(/\s+/).map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const colorMap: Record<string, string> = {
    "ME": "bg-teal-600 text-teal-50 shadow-sm shadow-teal-700/10",
    "AR": "bg-indigo-600 text-indigo-50 shadow-sm shadow-indigo-700/10",
    "JL": "bg-purple-600 text-purple-50 shadow-sm shadow-purple-700/10",
    "SC": "bg-amber-600 text-amber-50 shadow-sm shadow-amber-700/10",
  };
  const colorClass = colorMap[initials] || "";
  
  const getHslColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 60%, 40%)`;
  };

  const style = colorClass ? {} : { backgroundColor: getHslColor(name), color: "#ffffff" };

  return (
    <div 
      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold tracking-wider ring-1 ring-black/5 dark:ring-white/10 ${colorClass}`}
      style={style}
      title={name}
    >
      {initials}
    </div>
  );
}

type TaskDashboardProps = {
  eyebrow?: string;
  heading: string;
  description?: string;
  banner?: string;
  showBottomSpotlights?: boolean;
  taskModule?: "list" | "my" | "all";
};

export function TaskDashboard({
  eyebrow = "Workspace",
  heading,
  description,
  banner,
  taskModule = "list",
}: TaskDashboardProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");

  const [assigneesList, setAssigneesList] = useState<string[]>(ASSIGNEES);

  const {
    priority: defaultPriority,
    category: defaultCategory,
    labels: defaultLabels,
    customCategories,
    customLabels,
    fetchDefaults,
  } = useWorkspaceDefaultsStore();

  // ── Fetch Defaults on mount ────────────────────────────────
  useEffect(() => {
    const wid = getWid();
    fetchDefaults(wid);
  }, [fetchDefaults]);

  // ── Load tasks from API ────────────────────────────────────
  useEffect(() => {
    async function loadTasks() {
      setTasksLoading(true);
      try {
        const wid = getWid();
        const res = await fetch(`/api/task?wid=${wid}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.tasks)) {
          setTasks(json.tasks.map(mapApiTask));
        }
      } catch (err) {
        console.error("Error loading tasks:", err);
      } finally {
        setTasksLoading(false);
      }
    }
    loadTasks();
  }, []);

  // ── Load team members ──────────────────────────────────────
  useEffect(() => {
    async function loadTeam() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const wid = getWid();
          const res = await fetch(`/api/team?email=${encodeURIComponent(user.email || "")}&wid=${wid}`);
          const json = await res.json();
          if (json.success && json.members) {
            const memberNames = json.members.map((u: any) => {
              return `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0];
            });
            const combined = Array.from(new Set(["Unassigned", "Me", ...memberNames]));
            setAssigneesList(combined);
          }
        }
      } catch (err) {
        console.error("Error loading team in TaskDashboard:", err);
      }
    }
    loadTeam();
  }, []);

  
  // Advanced multi-filtering states
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterAssignees, setFilterAssignees] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<"assignee" | "category" | "label" | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Modal & inline states
  const [addOpen, setAddOpen] = useState(false);
  const [addModalSession, setAddModalSession] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  
  // Inline column add text inputs
  const [columnQuickAdd, setColumnQuickAdd] = useState<Record<string, string>>({
    todo: "",
    in_progress: "",
    blocked: "",
    done: "",
  });
  const [activeQuickAddColumn, setActiveQuickAddColumn] = useState<string | null>(null);

  // Dropdown states for inline editing in Table view
  const [activeDropdown, setActiveDropdown] = useState<{ taskId: string; field: string } | null>(null);
  const dropdownRef = useRef<any>(null);

  // Handles clicking outside to close active dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter tasks relative to the selected workspace type (My tasks, All tasks, etc.)
  const moduleTasks = useMemo(() => {
    if (taskModule === "my") {
      return tasks.filter((t) => t.assignee === "Me");
    }
    return tasks;
  }, [tasks, taskModule]);

  // Apply search query and multi-filters
  const filteredTasks = useMemo(() => {
    return moduleTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = filterPriority === "All" ? true : task.priority === filterPriority.toLowerCase();
      const matchesAssignee = filterAssignees.length === 0 ? true : filterAssignees.includes(task.assignee || "Unassigned");
      const matchesCategory = filterCategories.length === 0 ? true : (task.category && filterCategories.includes(task.category));
      const matchesLabel = filterLabels.length === 0 ? true : (task.labels && task.labels.some((l) => filterLabels.includes(l)));

      return matchesSearch && matchesPriority && matchesAssignee && matchesCategory && matchesLabel;
    });
  }, [moduleTasks, searchQuery, filterPriority, filterAssignees, filterCategories, filterLabels]);

  // Aggregate columns counts
  const columnsCounts = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, in_progress: 0, blocked: 0, done: 0 };
    filteredTasks.forEach((t) => {
      const status = t.status || "todo";
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [filteredTasks]);

  // ── Core task mutation helpers ──────────────────────────────

  async function patchTask(id: string, fields: Record<string, unknown>) {
    try {
      const res = await fetch("/api/task", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } catch (err) {
      console.error("Task PATCH error:", err);
      showToast("Failed to update task", "error" as any);
    }
  }

  function handleToggleDone(id: string) {
    let newDone = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          newDone = !t.done;
          return { ...t, done: newDone, status: newDone ? "done" : "todo" };
        }
        return t;
      })
    );
    const task = tasks.find((t) => t.id === id);
    const willBeDone = task ? !task.done : false;
    patchTask(id, { done: willBeDone, status: willBeDone ? "done" : "todo" });
    showToast(willBeDone ? "Task completed 🎉" : "Task marked as incomplete", "success");
  }

  const statusLabelMap: Record<TaskStatus, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    blocked: "Blocked",
    done: "Done"
  };

  function handleStatusChange(id: string, newStatus: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: newStatus, done: newStatus === "done" } : t)
    );
    if (selectedTask && selectedTask.id === id)
      setSelectedTask((prev) => prev ? { ...prev, status: newStatus, done: newStatus === "done" } : null);
    patchTask(id, { status: newStatus, done: newStatus === "done" });
    showToast(`Task status updated to "${statusLabelMap[newStatus]}"`, "info");
  }

  function handlePriorityChange(id: string, newPriority: TaskPriority) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, priority: newPriority } : t));
    if (selectedTask && selectedTask.id === id)
      setSelectedTask((prev) => prev ? { ...prev, priority: newPriority } : null);
    patchTask(id, { priority: newPriority });
    showToast(`Task priority set to "${newPriority.charAt(0).toUpperCase() + newPriority.slice(1)}"`, "info");
  }

  function handleAssigneeChange(id: string, newAssignee: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, assignee: newAssignee } : t));
    if (selectedTask && selectedTask.id === id)
      setSelectedTask((prev) => prev ? { ...prev, assignee: newAssignee } : null);
    patchTask(id, { assignee: newAssignee });
    showToast(`Task assigned to ${newAssignee}`, "info");
  }

  function handleCategoryChange(id: string, newCategory: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, category: newCategory } : t));
    if (selectedTask && selectedTask.id === id)
      setSelectedTask((prev) => prev ? { ...prev, category: newCategory } : null);
    patchTask(id, { category: newCategory });
    showToast(`Task category set to "${newCategory}"`, "info");
  }

  function handleEstimateChange(id: string, newEstimate: string) {
    const est = newEstimate === "—" ? null : newEstimate;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, estimate: est ?? undefined } : t));
    if (selectedTask && selectedTask.id === id)
      setSelectedTask((prev) => prev ? { ...prev, estimate: est ?? undefined } : null);
    patchTask(id, { estimate: est });
    showToast(`Task story points set to ${newEstimate}`, "info");
  }

  function handleTitleChange(id: string, newTitle: string) {
    if (!newTitle.trim()) return;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, title: newTitle } : t));
    patchTask(id, { title: newTitle });
  }

  function handleDescriptionChange(id: string, newDesc: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, description: newDesc } : t));
    // Debounced in drawer – patchTask called on blur (see drawer textarea)
  }

  async function handleTaskDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
    try {
      const res = await fetch(`/api/task?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Task deleted successfully.", "info");
    } catch (err) {
      console.error("Task DELETE error:", err);
      showToast("Failed to delete task", "error" as any);
    }
  }

  // ── Create task (modal) ────────────────────────────────────
  async function handleAddTaskFromModal(payload: NewTaskPayload) {
    const wid = getWid();
    // Optimistic insert with a temp id
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticTask: Task = {
      id: tempId,
      title: payload.title,
      description: payload.description || undefined,
      due: payload.dueLabel,
      priority: payload.priority,
      category: payload.category,
      labels: payload.labels.length ? payload.labels : undefined,
      assignee: payload.assignee,
      status: payload.status,
      estimate: payload.estimate,
      done: payload.status === "done",
    };
    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          priority: payload.priority,
          status: payload.status,
          due: payload.dueLabel,
          labels: payload.labels,
          assignee: payload.assignee,
          estimate: payload.estimate,
          projectId: payload.projectId,
          workspaceId: wid,
        }),
      });
      const json = await res.json();
      if (json.success && json.task) {
        // Replace optimistic entry with real DB record
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? mapApiTask(json.task) : t))
        );
        showToast(`Task "${payload.title}" created successfully!`, "success");
      } else {
        throw new Error(json.error);
      }
    } catch (err) {
      console.error("Task POST error:", err);
      // Roll back optimistic insert
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      showToast("Failed to create task", "error" as any);
    }
  }

  async function handleQuickAddCard(status: TaskStatus) {
    const text = columnQuickAdd[status]?.trim();
    if (!text) return;
    const wid = getWid();
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticTask: Task = {
      id: tempId,
      title: text,
      due: "No date",
      priority: (defaultPriority as TaskPriority) || "medium",
      status,
      category: defaultCategory || "General",
      assignee: "Unassigned",
      labels: defaultLabels || [],
      done: status === "done",
    };
    setTasks((prev) => [...prev, optimisticTask]);
    setColumnQuickAdd((prev) => ({ ...prev, [status]: "" }));
    setActiveQuickAddColumn(null);

    try {
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: text,
          due: "No date",
          priority: defaultPriority || "medium",
          status,
          category: defaultCategory || "General",
          assignee: "Unassigned",
          labels: defaultLabels || [],
          done: status === "done",
          workspaceId: wid,
        }),
      });
      const json = await res.json();
      if (json.success && json.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? mapApiTask(json.task) : t))
        );
        showToast(`Task "${text}" added successfully!`, "success");
      } else {
        throw new Error(json.error);
      }
    } catch (err) {
      console.error("Quick add error:", err);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      showToast("Failed to add task", "error" as any);
    }
  }

  // Drag and drop HTML5 handlers
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedTaskId(id);
    e.dataTransfer.setData("text/plain", id);
    // Smooth transparent drag ghost
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) {
      handleStatusChange(taskId, status);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }

  function resetAllFilters() {
    setSearchQuery("");
    setFilterPriority("All");
    setFilterAssignees([]);
    setFilterCategories([]);
    setFilterLabels([]);
  }

  const hasActiveFilters =
    searchQuery !== "" ||
    filterPriority !== "All" ||
    filterAssignees.length > 0 ||
    filterCategories.length > 0 ||
    filterLabels.length > 0;

  return (
    <div className="flex h-[calc(100vh-3.75rem)] w-full flex-col overflow-hidden bg-transparent dark:bg-zinc-950">
      {/* Loading overlay */}
      {tasksLoading && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-zinc-950/60">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--app-primary)] border-t-transparent" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Loading tasks…</span>
          </div>
        </div>
      )}
      
      {/* 1. Fluid Modern JIRA-like Header & Multi-Filter row */}
      <div className="flex shrink-0 flex-col border-b border-zinc-200/70 bg-white/80 px-6 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md dark:border-white/[0.06] dark:bg-zinc-900/60 space-y-4">
        
        {/* Title and eyebrow */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {eyebrow}
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-xs font-semibold text-[var(--app-primary)] bg-[var(--app-primary-soft)] px-2 py-0.5 rounded-full dark:bg-teal-950/40 dark:text-teal-200">
              Active: {filteredTasks.length}
            </span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {heading}
          </h1>
        </div>

        {/* Unified Controls Row: Search, Filters, View toggle, and Add task button */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search query box */}
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search board…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-normal text-zinc-800 shadow-sm outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100 dark:focus:border-zinc-700"
              />
            </div>

            {/* Single Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all hover:scale-[1.01] active:scale-95 ${
                (filterPriority !== "All" || filterAssignees.length > 0 || filterCategories.length > 0 || filterLabels.length > 0)
                  ? "border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
              {(filterPriority !== "All" || filterAssignees.length > 0 || filterCategories.length > 0 || filterLabels.length > 0) && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--app-primary)] px-1 text-[10px] font-black text-white">
                  {[
                    filterPriority !== "All",
                    filterAssignees.length > 0,
                    filterCategories.length > 0,
                    filterLabels.length > 0
                  ].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Clear All Shortcut if filters are active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-rose-950/20"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sliding View Toggle (Table / Board) */}
            <div className="relative flex rounded-xl bg-stone-100 p-1 dark:bg-zinc-900/90 ring-1 ring-black/5 dark:ring-white/5">
              
              {/* Backing spring pill */}
              <div className="absolute inset-y-1 left-1 right-1 pointer-events-none">
                <div
                  className={`h-full w-[calc(50%-2px)] rounded-lg bg-white shadow-sm ring-1 ring-black/[0.04] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] dark:bg-zinc-800 ${
                    viewMode === "table" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
              </div>

              {/* View Buttons */}
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`relative z-10 flex h-8 items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold transition-colors duration-200 ${
                  viewMode === "kanban"
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <ViewColumnsIcon className="h-4 w-4 shrink-0" />
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`relative z-10 flex h-8 items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold transition-colors duration-200 ${
                  viewMode === "table"
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <TableCellsIcon className="h-4 w-4 shrink-0" />
                Table
              </button>
            </div>

            {/* Add Task Primary Action Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                setAddModalSession((s) => s + 1);
                setAddOpen(true);
              }}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--app-primary-hover)] lg:px-5"
            >
              <PlusIcon className="h-4 w-4" />
              Add task
            </motion.button>
          </div>
        </div>

        {/* Active Filter Badges Display */}
        {(filterPriority !== "All" || filterAssignees.length > 0 || filterCategories.length > 0 || filterLabels.length > 0 || searchQuery !== "") && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Applied Filters:</span>
            
            {searchQuery !== "" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-655 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300">
                <span>Query:</span>
                <span className="text-zinc-450 font-normal">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery("")} className="text-zinc-450 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
 
            {filterPriority !== "All" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-655 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300">
                <span>Priority:</span>
                <span className="text-zinc-450 font-normal">{filterPriority === "Medium" ? "Normal" : filterPriority}</span>
                <button onClick={() => setFilterPriority("All")} className="text-zinc-450 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
 
            {filterAssignees.map((assigneeName) => (
              <span key={assigneeName} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-655 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300">
                <span>Assignee:</span>
                <span className="text-zinc-450 font-normal">{assigneeName}</span>
                <button onClick={() => setFilterAssignees((prev) => prev.filter((a) => a !== assigneeName))} className="text-zinc-450 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
 
            {filterCategories.map((categoryName) => (
              <span key={categoryName} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-655 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300">
                <span>Category:</span>
                <span className="text-zinc-450 font-normal">{categoryName}</span>
                <button onClick={() => setFilterCategories((prev) => prev.filter((c) => c !== categoryName))} className="text-zinc-450 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
 
            {filterLabels.map((labelName) => (
              <span key={labelName} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-655 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300">
                <span>Label:</span>
                <span className="text-zinc-450 font-normal">{labelName}</span>
                <button onClick={() => setFilterLabels((prev) => prev.filter((l) => l !== labelName))} className="text-zinc-450 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
 
            <button
              onClick={resetAllFilters}
              className="text-[11px] font-black text-rose-500 hover:text-rose-600 hover:underline px-1 py-0.5 ml-1 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 2. Scrollable Body containing Table View or Kanban View */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === "kanban" ? (
            
            /* ========================================================
               KANBAN VIEW (Jira / Trello Lanes)
               ======================================================== */
            <motion.div
              key="kanban-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-full w-full overflow-x-auto p-6 items-start gap-4 scrollbar-thin select-none"
            >
              {COLUMNS.map((col) => {
                const columnTasks = filteredTasks.filter((t) => t.status === col.id);
                const isOver = dragOverColumn === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`flex h-full min-h-[400px] w-72 shrink-0 flex-col rounded-2xl border transition-all duration-200 ${col.bg} ${
                      isOver
                        ? "border-[var(--app-primary)] shadow-[0_0_0_2px_rgba(13,148,136,0.1)] scale-[1.01]"
                        : `border-transparent`
                    }`}
                  >
                    
                    {/* Lane Header */}
                    <div className="flex shrink-0 items-center justify-between px-3 py-3 border-b border-zinc-200/40 dark:border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                        <span className="font-heading text-[14px] font-bold text-zinc-800 dark:text-zinc-100">
                          {col.label}
                        </span>
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-zinc-200/70 px-1 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {columnTasks.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuickAddColumn(col.id);
                        }}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        title={`Add task to ${col.label}`}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Lane Cards Scroll Zone */}
                    <div
                      onDragEnter={() => setDragOverColumn(col.id)}
                      className="flex-1 overflow-y-auto px-2 py-3.5 space-y-3.5 scrollbar-thin"
                    >
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => setSelectedTask(task)}
                          className="group relative cursor-grab rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm shadow-zinc-200/40 hover:border-zinc-300/80 active:cursor-grabbing hover:shadow-[0_4px_16px_-4px_rgba(24,24,27,0.06)] dark:border-white/[0.05] dark:bg-zinc-900/90 dark:shadow-none dark:hover:border-zinc-700 transition-[border-color,box-shadow]"
                        >
                          {/* Card Top Row: Category & Priority */}
                          <div className="flex items-center justify-between gap-2">
                            {task.category ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                {task.category}
                              </span>
                            ) : (
                              <span />
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${priorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4 className="mt-2 text-[13px] font-semibold leading-snug tracking-tight text-zinc-900 group-hover:text-[var(--app-primary)] dark:text-zinc-100 dark:group-hover:text-teal-400 transition-colors">
                            {task.title}
                          </h4>

                          {/* Task Description snippet */}
                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                              {task.description}
                            </p>
                          )}

                          {/* Labels list */}
                          {task.labels && task.labels.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {task.labels.map((label) => (
                                <span
                                  key={label}
                                  className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-700/50"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Card Footer: Due Date, Estimates & Assignee */}
                          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-white/[0.03]">
                            
                            {/* Estimate and Due Dates */}
                            <div className="flex items-center gap-2">
                              {task.estimate && (
                                <div className="flex items-center gap-0.5 rounded-full bg-teal-50/70 border border-teal-100/50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-900/30">
                                  <ClockIcon className="h-3 w-3 shrink-0 opacity-80" />
                                  <span>{task.estimate}</span>
                                </div>
                              )}
                              {task.due && task.due !== "No date" && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                                  task.due.includes("Today") || task.due.includes("Urgent") || task.due.includes("Yesterday")
                                    ? "text-rose-500 font-semibold"
                                    : "text-zinc-400"
                                }`}>
                                  <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                  <span>{task.due}</span>
                                </span>
                              )}
                            </div>

                            {/* Assignee Avatar */}
                            {getAvatar(task.assignee || "Unassigned")}
                          </div>

                        </div>
                      ))}

                      {/* Display empty lane guidance */}
                      {columnTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-zinc-200 dark:border-white/[0.06] opacity-45">
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Drag or click + to add</p>
                        </div>
                      )}
                    </div>

                    {/* Column Quick Card Creator at bottom */}
                    <div className="shrink-0 p-2 border-t border-zinc-200/40 dark:border-white/[0.04]">
                      {activeQuickAddColumn === col.id ? (
                        <div className="rounded-xl bg-white p-2 border border-zinc-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                          <input
                            type="text"
                            placeholder="Enter a title for this card…"
                            value={columnQuickAdd[col.id]}
                            onChange={(e) =>
                              setColumnQuickAdd((prev) => ({ ...prev, [col.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleQuickAddCard(col.id);
                            }}
                            className="w-full text-xs font-normal bg-stone-50 border border-zinc-200/70 p-2 rounded-lg outline-none focus:border-zinc-400 dark:bg-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-700"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setColumnQuickAdd((prev) => ({ ...prev, [col.id]: "" }));
                                setActiveQuickAddColumn(null);
                              }}
                              className="px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAddCard(col.id)}
                              disabled={!columnQuickAdd[col.id]?.trim()}
                              className="bg-[var(--app-primary)] text-white px-2.5 py-1 rounded text-[10px] font-semibold disabled:opacity-45 hover:bg-[var(--app-primary-hover)]"
                            >
                              Add card
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveQuickAddColumn(col.id)}
                          className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold text-zinc-500 hover:bg-white hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800 transition-colors"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                          Add a card
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            
            /* ========================================================
               TABLE VIEW (Dynamic Inline Spreadsheet Grid)
               ======================================================== */
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full overflow-auto px-6 py-4 scrollbar-thin select-none"
            >
              <div className="min-w-[950px] inline-block align-middle w-full rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/60">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-zinc-200/80 dark:border-white/[0.06] bg-stone-50/50 dark:bg-zinc-900/40 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 h-10">
                      <th className="w-[4%] text-center pl-3">Done</th>
                      <th className="w-[30%] px-4">Task Name</th>
                      <th className="w-[11%] px-3">Status</th>
                      <th className="w-[11%] px-3">Priority</th>
                      <th className="w-[12%] px-3">Assignee</th>
                      <th className="w-[8%] px-3">Estimate</th>
                      <th className="w-[12%] px-3">Category</th>
                      <th className="w-[12%] px-3">Due Date</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-zinc-200/50 dark:divide-white/[0.04]">
                    {filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="group text-[13px] hover:bg-stone-50/50 dark:hover:bg-zinc-900/30 transition-colors h-12"
                      >
                        {/* 1. Toggle Checkbox */}
                        <td className="text-center pl-3">
                          <button
                            type="button"
                            onClick={() => handleToggleDone(task.id)}
                            className="flex h-5 w-5 mx-auto items-center justify-center rounded border border-zinc-300 bg-stone-50 hover:border-zinc-400 hover:text-[var(--app-primary)] dark:border-zinc-700 dark:bg-zinc-900 transition-colors"
                          >
                            {task.done ? (
                              <CheckCircleSolid className="h-4 w-4 text-[var(--app-primary)]" />
                            ) : (
                              <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                            )}
                          </button>
                        </td>

                        {/* 2. Task Title & hover editing drawer */}
                        <td className="px-4 font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => setSelectedTask(task)}
                              className={`cursor-pointer hover:text-[var(--app-primary)] dark:hover:text-teal-400 transition-colors ${
                                task.done ? "line-through text-zinc-400 dark:text-zinc-500 font-normal" : ""
                              }`}
                            >
                              {task.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedTask(task)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-all ml-1"
                              title="Edit task details"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* 3. Inline Status Badge selector */}
                        <td className="px-3 relative" ref={activeDropdown?.taskId === task.id && activeDropdown?.field === "status" ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown?.field === "status" ? null : { taskId: task.id, field: "status" })}
                            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <span>{COLUMNS.find(c => c.id === task.status)?.label || "To Do"}</span>
                            <ChevronDownIcon className="h-3 w-3 opacity-60" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "status" && (
                            <div className="absolute left-3 top-10 z-30 w-36 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                              {COLUMNS.map((col) => (
                                <button
                                  key={col.id}
                                  type="button"
                                  onClick={() => {
                                    handleStatusChange(task.id, col.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex w-full items-center px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  {col.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 4. Inline Priority selector */}
                        <td className="px-3 relative" ref={activeDropdown?.taskId === task.id && activeDropdown?.field === "priority" ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown?.field === "priority" ? null : { taskId: task.id, field: "priority" })}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border hover:opacity-90 transition-opacity ${priorityColor(task.priority)}`}
                          >
                            <span>{task.priority}</span>
                            <ChevronDownIcon className="h-3 w-3 opacity-70" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "priority" && (
                            <div className="absolute left-3 top-10 z-30 w-32 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                              {PRIORITIES.map((pri) => (
                                <button
                                  key={pri}
                                  type="button"
                                  onClick={() => {
                                    handlePriorityChange(task.id, pri);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex w-full items-center px-3 py-1.5 text-xs capitalize text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  {pri}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 5. Inline Assignee selector */}
                        <td className="px-3 relative" ref={activeDropdown?.taskId === task.id && activeDropdown?.field === "assignee" ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown?.field === "assignee" ? null : { taskId: task.id, field: "assignee" })}
                            className="flex items-center gap-1.5 hover:bg-stone-100 p-1 rounded-lg transition-colors text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            {getAvatar(task.assignee || "Unassigned")}
                            <span className="truncate text-xs font-medium max-w-[70px]">{task.assignee || "Unassigned"}</span>
                            <ChevronDownIcon className="h-3 w-3 opacity-40 shrink-0" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "assignee" && (
                            <div className="absolute left-3 top-10 z-30 w-44 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                              {ASSIGNEES.map((assignee) => (
                                <button
                                  key={assignee}
                                  type="button"
                                  onClick={() => {
                                    handleAssigneeChange(task.id, assignee);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  {getAvatar(assignee)}
                                  <span>{assignee}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 6. Inline Estimate selector */}
                        <td className="px-3 relative" ref={activeDropdown?.taskId === task.id && activeDropdown?.field === "estimate" ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown?.field === "estimate" ? null : { taskId: task.id, field: "estimate" })}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                          >
                            <span>{task.estimate || "—"}</span>
                            <ChevronDownIcon className="h-2.5 w-2.5 opacity-55" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "estimate" && (
                            <div className="absolute left-3 top-10 z-30 w-24 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                              {ESTIMATES.map((est) => (
                                <button
                                  key={est}
                                  type="button"
                                  onClick={() => {
                                    handleEstimateChange(task.id, est);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex w-full items-center px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  {est}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 7. Inline Category selector */}
                        <td className="px-3 relative" ref={activeDropdown?.taskId === task.id && activeDropdown?.field === "category" ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown?.field === "category" ? null : { taskId: task.id, field: "category" })}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            <span>{task.category || "General"}</span>
                            <ChevronDownIcon className="h-3 w-3 opacity-40" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "category" && (
                            <div className="absolute left-3 top-10 z-30 w-36 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                              {(customCategories || []).map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    handleCategoryChange(task.id, cat);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex w-full items-center px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 8. Due date */}
                        <td className="px-3 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {task.due}
                        </td>
                      </tr>
                    ))}

                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-zinc-400 dark:text-zinc-500">
                          No tasks match the search or filter query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. TASK DETAILS SLIDING DRAWER (Right-Sidebar Modal) */}
      <AnimatePresence>
        {selectedTask && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 z-40 bg-zinc-950 dark:bg-black"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="absolute inset-y-0 right-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-zinc-200 bg-[var(--background)] shadow-2xl dark:border-white/[0.08] dark:bg-zinc-900"
            >
              
              {/* Drawer Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/60 px-6 py-4 dark:border-white/[0.06] bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Task details
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    ID: {selectedTask.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTaskDelete(selectedTask.id)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 transition-colors"
                    title="Delete task"
                  >
                    <TrashIcon className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="rounded-lg border border-zinc-200/80 p-1.5 text-zinc-500 transition-colors hover:bg-white hover:text-zinc-800 dark:border-white/[0.08] dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    aria-label="Close panel"
                  >
                    <XMarkIcon className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
                
                {/* Title (Interactive edit) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTasks((prev) =>
                        prev.map((t) => (t.id === selectedTask.id ? { ...t, title: val } : t))
                      );
                      setSelectedTask((prev) => prev ? { ...prev, title: val } : null);
                    }}
                    onBlur={(e) => { if (e.target.value.trim()) patchTask(selectedTask.id, { title: e.target.value }); }}
                    className="w-full text-base font-bold bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-[var(--app-primary)] py-1.5 outline-none tracking-tight text-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 dark:focus:border-teal-500 transition-colors"
                  />
                </div>

                {/* Description (Interactive edit) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={selectedTask.description || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleDescriptionChange(selectedTask.id, val);
                      setSelectedTask((prev) => prev ? { ...prev, description: val } : null);
                    }}
                    onBlur={(e) => patchTask(selectedTask.id, { description: e.target.value })}
                    placeholder="Describe this task in detail so others can pick it up..."
                    className="w-full text-xs font-normal text-zinc-800 leading-relaxed bg-white border border-zinc-200 rounded-xl p-3 outline-none focus:border-zinc-400 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:bg-zinc-950/40 dark:border-white/[0.08] dark:text-zinc-200 dark:focus:border-zinc-700 transition-[border-color,box-shadow]"
                  />
                </div>

                {/* Metadata attributes list */}
                <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/50 space-y-4">
                  
                  <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pb-2 border-b border-zinc-100 dark:border-white/[0.03]">
                    Attributes
                  </h5>

                  {/* Attribute: Status */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</span>
                    <div className="col-span-2 select-none">
                      <select
                        value={selectedTask.status || "todo"}
                        onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                        className="w-full text-xs font-bold text-zinc-700 bg-stone-50 hover:bg-stone-100 border border-zinc-200 p-2 rounded-lg outline-none cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>

                  {/* Attribute: Priority */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Priority</span>
                    <div className="col-span-2">
                      <select
                        value={selectedTask.priority}
                        onChange={(e) => handlePriorityChange(selectedTask.id, e.target.value as TaskPriority)}
                        className="w-full text-xs font-bold text-zinc-700 bg-stone-50 hover:bg-stone-100 border border-zinc-200 p-2 rounded-lg outline-none cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Normal / Medium</option>
                        <option value="high">High / Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Attribute: Assignee */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Assignee</span>
                    <div className="col-span-2">
                      <select
                        value={selectedTask.assignee || "Unassigned"}
                        onChange={(e) => handleAssigneeChange(selectedTask.id, e.target.value)}
                        className="w-full text-xs font-medium text-zinc-700 bg-stone-50 hover:bg-stone-100 border border-zinc-200 p-2 rounded-lg outline-none cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
                      >
                        {assigneesList.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Attribute: Category */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</span>
                    <div className="col-span-2">
                      <select
                        value={selectedTask.category || "General"}
                        onChange={(e) => handleCategoryChange(selectedTask.id, e.target.value)}
                        className="w-full text-xs font-medium text-zinc-700 bg-stone-50 hover:bg-stone-100 border border-zinc-200 p-2 rounded-lg outline-none cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
                      >
                        {(customCategories || []).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Attribute: Story Points */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Story Points</span>
                    <div className="col-span-2">
                      <select
                        value={selectedTask.estimate || "—"}
                        onChange={(e) => handleEstimateChange(selectedTask.id, e.target.value)}
                        className="w-full text-xs font-semibold text-zinc-700 bg-stone-50 hover:bg-stone-100 border border-zinc-200 p-2 rounded-lg outline-none cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
                      >
                        {ESTIMATES.map((est) => (
                          <option key={est} value={est}>{est}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Attribute: Due Date */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Due Label</span>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={selectedTask.due}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTasks((prev) =>
                            prev.map((t) => (t.id === selectedTask.id ? { ...t, due: val } : t))
                          );
                          setSelectedTask((prev) => prev ? { ...prev, due: val } : null);
                        }}
                        className="w-full text-xs font-semibold text-zinc-700 bg-stone-50 border border-zinc-200 p-2 rounded-lg outline-none focus:bg-white dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-200/60 px-6 py-4 dark:border-white/[0.06] bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700/80"
                >
                  Close panel
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modern AddTaskModal component integrated */}
      <AddTaskModal
        key={addModalSession}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleAddTaskFromModal}
        assignees={assigneesList}
      />

      {/* Dynamic Filters Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterModalOpen(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="fixed inset-x-4 top-24 z-50 mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-[var(--app-primary)]" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Filter Workspace Tasks</h3>
                </div>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-650 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="mt-5 space-y-5">
                {/* 1. Priority */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Priority</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Low", "Medium", "High"].map((p) => {
                      const isSelected = p === "All" ? filterPriority === "All" : filterPriority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFilterPriority(p)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                            isSelected
                              ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                              : "border-zinc-200 bg-zinc-50 text-zinc-650 hover:bg-zinc-100 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {p === "Medium" ? "Normal" : p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Assignees */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Assignees</h4>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenFilterDropdown(prev => prev === "assignee" ? null : "assignee")}
                      className="flex w-full h-10 items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 shadow-sm outline-none cursor-pointer hover:bg-zinc-100/50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <span className="truncate">
                        {filterAssignees.length === 0 ? "All Assignees" : filterAssignees.join(", ")}
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${openFilterDropdown === "assignee" ? "rotate-180" : ""}`} />
                    </button>
                    {openFilterDropdown === "assignee" && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenFilterDropdown(null)} />
                        <div className="absolute left-0 mt-1.5 w-full z-20 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#121418]">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterAssignees([]);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            <span>All Assignees</span>
                            {filterAssignees.length === 0 && <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />}
                          </button>
                          <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
                          {assigneesList.map((a) => {
                            const isSelected = filterAssignees.includes(a);
                            return (
                              <button
                                key={a}
                                type="button"
                                onClick={() => {
                                  setFilterAssignees((prev) =>
                                    prev.includes(a) ? prev.filter((item) => item !== a) : [...prev, a]
                                  );
                                }}
                                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                <span className="truncate">{a}</span>
                                {isSelected && <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Categories */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Categories</h4>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenFilterDropdown(prev => prev === "category" ? null : "category")}
                      className="flex w-full h-10 items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 shadow-sm outline-none cursor-pointer hover:bg-zinc-100/50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <span className="truncate">
                        {filterCategories.length === 0 ? "All Categories" : filterCategories.join(", ")}
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${openFilterDropdown === "category" ? "rotate-180" : ""}`} />
                    </button>
                    {openFilterDropdown === "category" && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenFilterDropdown(null)} />
                        <div className="absolute left-0 mt-1.5 w-full z-20 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#121418]">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterCategories([]);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            <span>All Categories</span>
                            {filterCategories.length === 0 && <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />}
                          </button>
                          <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
                          {(customCategories || []).map((cat) => {
                            const isSelected = filterCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setFilterCategories((prev) =>
                                    prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
                                  );
                                }}
                                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                <span className="truncate">{cat}</span>
                                {isSelected && <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. Labels */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Labels</h4>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenFilterDropdown(prev => prev === "label" ? null : "label")}
                      className="flex w-full h-10 items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 shadow-sm outline-none cursor-pointer hover:bg-zinc-100/50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <span className="truncate">
                        {filterLabels.length === 0 ? "All Labels" : filterLabels.join(", ")}
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${openFilterDropdown === "label" ? "rotate-180" : ""}`} />
                    </button>
                    {openFilterDropdown === "label" && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenFilterDropdown(null)} />
                        <div className="absolute left-0 mt-1.5 w-full z-20 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#121418]">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterLabels([]);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            <span>All Labels</span>
                            {filterLabels.length === 0 && <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />}
                          </button>
                          <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
                          {(customLabels || []).map((lab) => {
                            const isSelected = filterLabels.includes(lab);
                            return (
                              <button
                                key={lab}
                                type="button"
                                onClick={() => {
                                  setFilterLabels((prev) =>
                                    prev.includes(lab) ? prev.filter((item) => item !== lab) : [...prev, lab]
                                  );
                                }}
                                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                <span className="truncate">{lab}</span>
                                {isSelected && <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-white/5">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  disabled={!hasActiveFilters}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Reset filters
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="rounded-xl bg-[var(--app-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--app-primary-hover)]"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      
    </div>
  );
}
