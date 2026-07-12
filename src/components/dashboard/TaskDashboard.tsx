"use client";

import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  PaperClipIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  EllipsisVerticalIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";

import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import { AppSelect } from "@/components/ui/AppSelect";
import type { NewTaskPayload, Task, TaskNote, TaskPriority, TaskStatus } from "@/types/task";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { useWorkspaceDefaultsStore } from "@/store/workspaceDefaultsStore";
import {
  TASK_PRIORITY_OPTIONS,
  normalizeTaskPriority,
  priorityDot,
  priorityLabel,
} from "@/lib/task-priority";
import { usePermissionAccess } from "@/lib/usePermissionAccess";
import {
  FREE_PLAN_TASKS_PER_MONTH_LIMIT,
  isUpgradeRequiredError,
} from "@/lib/plans";
import { useWorkspacePlan } from "@/lib/useWorkspacePlan";
import { DEFAULT_TASK_PAGE_SIZE } from "@/lib/task-list-query";
import { uploadFileToStorage } from "@/lib/storage/client-upload";
import { resolveStorageUrl } from "@/lib/storage/public-url";
import {
  downloadStorageFile,
  isImageStorageFile,
  previewStorageFile,
} from "@/lib/storage/attachments";



/* ─── helpers ─────────────────────────────────────────────── */

function getWid(): number {
  if (typeof window === "undefined") return 1;
  return parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10);
}

function isCurrentMonth(iso?: string) {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

type TaskAttachment = { name: string; size: number; dataUrl: string };

function fileNameFromAttachmentUrl(url: string, index: number): string {
  if (url.startsWith("data:")) {
    const mime = url.match(/^data:([^;,]+)/)?.[1] ?? "";
    if (mime.includes("pdf")) return `attachment-${index + 1}.pdf`;
    if (mime.includes("png")) return `attachment-${index + 1}.png`;
    if (mime.includes("jpeg") || mime.includes("jpg")) return `attachment-${index + 1}.jpg`;
    if (mime.includes("gif")) return `attachment-${index + 1}.gif`;
    if (mime.includes("webp")) return `attachment-${index + 1}.webp`;
    return `attachment-${index + 1}`;
  }
  try {
    const segment = new URL(url).pathname.split("/").pop();
    if (segment) return decodeURIComponent(segment);
  } catch {
    /* ignore */
  }
  return `attachment-${index + 1}`;
}

function urlsToAttachments(urls: string[] | undefined): TaskAttachment[] {
  return (urls ?? []).map((dataUrl, index) => ({
    name: fileNameFromAttachmentUrl(dataUrl, index),
    size: 0,
    dataUrl,
  }));
}

function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

const SIDEBAR_TITLE_MAX_CHARS = 80;
const DIALOG_TITLE_MAX_CHARS = 60;

function formatAttachmentSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getNoteAuthorHsl(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 55%, 42%)`;
}

function formatNoteTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function noteWasEdited(note: TaskNote) {
  return new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 2000;
}

function openAttachment(att: TaskAttachment) {
  const href = resolveStorageUrl(att.dataUrl);
  previewStorageFile(href);
}

async function downloadAttachmentFile(att: TaskAttachment): Promise<void> {
  await downloadStorageFile(resolveStorageUrl(att.dataUrl), att.name);
}

/** Map a raw Prisma task row to the frontend Task shape */
function mapApiTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    due: normalizeTaskDue(t.due),
    priority: normalizeTaskPriority(t.priority),
    category: t.category ?? undefined,
    labels: t.labels ?? [],
    assignee: t.assignee ?? undefined,
    assignees: t.assignees ?? [],
    status: (t.status as Task["status"]) ?? "todo",
    estimate: t.estimate ?? undefined,
    done: t.done ?? false,
    attachmentUrls: t.attachmentUrls ?? [],
    projectId: t.projectId ?? null,
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
  };
}

const COLUMNS: { id: TaskStatus; label: string; bg: string; dot: string; border: string; darkBorder: string; headerBorder: string }[] = [
  { id: "todo", label: "To Do", bg: "bg-zinc-100/80 dark:bg-zinc-900/40", dot: "bg-zinc-400", border: "border-zinc-300", darkBorder: "dark:border-zinc-600/70", headerBorder: "border-b-zinc-300/70 dark:border-b-zinc-600/50" },
  { id: "in_progress", label: "In Progress", bg: "bg-teal-50/60 dark:bg-teal-950/20", dot: "bg-teal-500", border: "border-teal-300", darkBorder: "dark:border-teal-700/60", headerBorder: "border-b-teal-300/80 dark:border-b-teal-700/50" },
  { id: "on_hold", label: "On Hold", bg: "bg-amber-50/60 dark:bg-amber-950/20", dot: "bg-amber-500", border: "border-amber-300", darkBorder: "dark:border-amber-700/60", headerBorder: "border-b-amber-300/80 dark:border-b-amber-700/50" },
  { id: "blocked", label: "Blocked", bg: "bg-rose-50/60 dark:bg-rose-950/20", dot: "bg-rose-500", border: "border-rose-300", darkBorder: "dark:border-rose-700/60", headerBorder: "border-b-rose-300/80 dark:border-b-rose-700/50" },
  { id: "overdue", label: "Overdue", bg: "bg-red-50/60 dark:bg-red-950/20", dot: "bg-red-600", border: "border-red-400", darkBorder: "dark:border-red-700/60", headerBorder: "border-b-red-400/80 dark:border-b-red-700/50" },
  { id: "done", label: "Done", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", dot: "bg-emerald-500", border: "border-emerald-300", darkBorder: "dark:border-emerald-700/60", headerBorder: "border-b-emerald-300/80 dark:border-b-emerald-700/50" },
];

function isTaskOverdue(due?: string, done?: boolean) {
  if (done || !due || due === "No date") return false;
  const parsed = new Date(due);
  if (Number.isNaN(parsed.getTime())) return false;
  parsed.setHours(23, 59, 59, 999);
  return parsed.getTime() < Date.now();
}

/** Legacy onboarding seeds used a bare "May 30" due string that always parsed as overdue. */
function normalizeTaskDue(due?: string | null): string {
  if (!due || due.trim() === "May 30") return "No date";
  return due;
}

/** Kanban column placement uses the stored status so user updates are respected. */
function getEffectiveStatus(task: Task): TaskStatus {
  if (task.done || task.status === "done") return "done";
  return (task.status as TaskStatus) || "todo";
}

function taskShowsOverdueBadge(task: Task): boolean {
  return getEffectiveStatus(task) !== "done" && isTaskOverdue(task.due, task.done);
}

const CATEGORIES = ["Product", "Engineering", "Design", "Operations", "Marketing", "General"];
const ASSIGNEES = ["Unassigned", "Me", "Alex Rivera", "Jordan Lee", "Sam Chen"];

const ALL_LABELS = ["Bug", "Feature", "Improvement", "Docs", "Design", "Meeting"];

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

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  colorDot?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: any) => void;
  options: readonly SelectOption[] | SelectOption[];
  placeholder?: string;
  className?: string;
}

function CustomSelect({ value, onChange, options, placeholder = "Select...", className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-705 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.colorDot && (
            <span className={`h-2 w-2 rounded-full ${selectedOption.colorDot}`} />
          )}
          {selectedOption?.icon && (
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-zinc-450 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#121418] scrollbar-thin min-w-[160px]"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.colorDot && (
                      <span className={`h-2 w-2 rounded-full ${opt.colorDot}`} />
                    )}
                    {opt.icon && (
                      <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{opt.icon}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const handleToggle = (optVal: string) => {
    if (optVal === "Unassigned") {
      onChange([]);
      return;
    }
    const newValue = value.includes(optVal)
      ? value.filter((v) => v !== optVal)
      : [...value.filter((v) => v !== "Unassigned"), optVal];
    onChange(newValue);
  };

  const displayLabel =
    value.length === 0
      ? "Unassigned"
      : value.length === 1
      ? value[0]
      : `${value.length} assignees`;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-755 shadow-sm outline-none cursor-pointer transition-all hover:bg-stone-50/60 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-455/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-zinc-450 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#121418] scrollbar-thin min-w-[160px]"
          >
            {options.map((opt) => {
              const isSelected =
                opt.value === "Unassigned"
                  ? value.length === 0
                  : value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggle(opt.value)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "text-zinc-655 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.colorDot && (
                      <span className={`h-2 w-2 rounded-full ${opt.colorDot}`} />
                    )}
                    {opt.icon && (
                      <span className="text-zinc-450 dark:text-zinc-500 shrink-0">{opt.icon}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
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
  const { can, alertNoPermission } = usePermissionAccess();
  const { ready: planReady, isPro, guardPlanFeature } = useWorkspacePlan();
  const canCreateTasks = can("create_tasks");
  const canEditTasks = can("edit_tasks");
  const canDeleteTasks = can("delete_tasks");
  const canReorderColumns = can("reorder_columns");

  const enforcePermission = (allowed: boolean) => {
    if (allowed) return true;
    alertNoPermission();
    return false;
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksCreatedThisMonth = useMemo(
    () => tasks.filter((task) => isCurrentMonth(task.createdAt)).length,
    [tasks]
  );
  const canCreateMoreTasksThisMonth =
    isPro || tasksCreatedThisMonth < FREE_PLAN_TASKS_PER_MONTH_LIMIT;
  const enforceTaskCreationLimit = () => {
    if (!planReady || canCreateMoreTasksThisMonth) return true;
    return guardPlanFeature("tasksLimit");
  };
  const [tasksLoading, setTasksLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [tablePage, setTablePage] = useState(1);
  const [tableTasks, setTableTasks] = useState<Task[]>([]);
  const [tableTasksLoading, setTableTasksLoading] = useState(false);
  const [tableTotal, setTableTotal] = useState(0);
  const [tableTotalPages, setTableTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [assigneesList, setAssigneesList] = useState<string[]>(ASSIGNEES);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserAssigneeKeys, setCurrentUserAssigneeKeys] = useState<string[]>(["me"]);

  const {
    priority: defaultPriority,
    category: defaultCategory,
    labels: defaultLabels,
    customCategories,
    customLabels,
    kanbanColumnOrder,
    fetchDefaults,
    updateDefaults,
  } = useWorkspaceDefaultsStore();

  const currentColumnOrder = kanbanColumnOrder && kanbanColumnOrder.length > 0
    ? kanbanColumnOrder
    : ["todo", "in_progress", "on_hold", "blocked", "overdue", "done"];

  // Helper function to resolve column properties dynamically
  function getColumnDetails(statusId: string, index: number) {
    const staticCol = COLUMNS.find(c => c.id === statusId);
    if (staticCol) return staticCol;

    // Custom status formatting
    const label = statusId
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Cycle colors/styles for custom columns
    const bgColors = [
      "bg-indigo-50/40 dark:bg-indigo-950/10",
      "bg-purple-50/40 dark:bg-purple-950/10",
      "bg-fuchsia-50/40 dark:bg-fuchsia-950/10",
      "bg-cyan-50/40 dark:bg-cyan-950/10",
    ];
    const borderColors = [
      "border-indigo-300",
      "border-purple-300",
      "border-fuchsia-300",
      "border-cyan-300",
    ];
    const darkBorderColors = [
      "dark:border-indigo-700/60",
      "dark:border-purple-700/60",
      "dark:border-fuchsia-700/60",
      "dark:border-cyan-700/60",
    ];
    const headerBorderColors = [
      "border-b-indigo-300/80 dark:border-b-indigo-700/50",
      "border-b-purple-300/80 dark:border-b-purple-700/50",
      "border-b-fuchsia-300/80 dark:border-b-fuchsia-700/50",
      "border-b-cyan-300/80 dark:border-b-cyan-700/50",
    ];
    const dotColors = [
      "bg-indigo-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-cyan-500",
    ];

    const styleIndex = index % bgColors.length;

    return {
      id: statusId,
      label,
      bg: bgColors[styleIndex],
      dot: dotColors[styleIndex],
      border: borderColors[styleIndex],
      darkBorder: darkBorderColors[styleIndex],
      headerBorder: headerBorderColors[styleIndex],
    };
  }

  const dynamicColumns = currentColumnOrder.map((statusId, idx) => getColumnDetails(statusId, idx));

  async function moveColumn(colId: string, direction: "left" | "right") {
    if (!enforcePermission(canReorderColumns)) return;
    const fromIndex = currentColumnOrder.indexOf(colId);
    if (fromIndex === -1) return;
    const toIndex = direction === "left" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= currentColumnOrder.length) return;

    const newOrder = [...currentColumnOrder];
    newOrder[fromIndex] = newOrder[toIndex];
    newOrder[toIndex] = colId;

    const wid = getWid();
    
    // Optimistically update the store state so it changes instantly
    useWorkspaceDefaultsStore.setState({ kanbanColumnOrder: newOrder });

    // Save defaults to backend
    await updateDefaults(wid, { kanbanColumnOrder: newOrder });
    showToast("Column order updated", "success" as any);
  }

  // ── Fetch Defaults on mount ────────────────────────────────
  useEffect(() => {
    const wid = getWid();
    fetchDefaults(wid);
  }, [fetchDefaults]);

  // ── Load team members ──────────────────────────────────────
  useEffect(() => {
    async function loadTeam() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const safeEmail = user.email || "";
          setCurrentUserEmail(safeEmail || null);

          const baseKeys = [
            "Me",
            safeEmail,
            safeEmail.includes("@") ? safeEmail.split("@")[0] : "",
          ].filter(Boolean);

          const wid = getWid();
          const res = await fetch(`/api/team?email=${encodeURIComponent(safeEmail)}&wid=${wid}`);
          const json = await res.json();
          if (json.success && json.members) {
            const memberNames = json.members.map((u: any) => {
              return `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0];
            });
            const combined = Array.from(new Set(["Unassigned", "Me", ...memberNames]));
            setAssigneesList(combined);

            const currentMember = json.members.find(
              (u: any) => (u.email || "").toLowerCase() === safeEmail.toLowerCase()
            );
            if (currentMember) {
              const fullName = `${currentMember.firstName || ""} ${currentMember.lastName || ""}`.trim();
              if (fullName) baseKeys.push(fullName);
            }
          }

          setCurrentUserAssigneeKeys(
            Array.from(new Set(baseKeys.map((k) => k.toLowerCase())))
          );
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
  const [filterProjectId, setFilterProjectId] = useState("all");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<"assignee" | "category" | "label" | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const buildTableTaskQuery = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      params.set("wid", String(getWid()));
      params.set("page", String(page));
      params.set("limit", String(DEFAULT_TASK_PAGE_SIZE));
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (filterPriority !== "All") params.set("priority", filterPriority);
      if (filterAssignees.length > 0) params.set("assignees", filterAssignees.join(","));
      if (filterCategories.length > 0) params.set("categories", filterCategories.join(","));
      if (filterLabels.length > 0) params.set("labels", filterLabels.join(","));
      if (filterProjectId !== "all") params.set("projectId", filterProjectId);
      if (taskModule === "my" && currentUserEmail) {
        params.set("scope", "my");
        params.set("email", currentUserEmail);
      }
      return params.toString();
    },
    [
      searchQuery,
      filterPriority,
      filterAssignees,
      filterCategories,
      filterLabels,
      filterProjectId,
      taskModule,
      currentUserEmail,
    ]
  );

  const loadAllTasks = useCallback(async () => {
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
  }, []);

  const loadTableTasks = useCallback(
    async (page: number) => {
      setTableTasksLoading(true);
      try {
        const res = await fetch(`/api/task?${buildTableTaskQuery(page)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.tasks)) {
          setTableTasks(json.tasks.map(mapApiTask));
          const total = json.pagination?.total ?? json.tasks.length;
          const totalPages = json.pagination?.totalPages ?? 1;
          setTableTotal(total);
          setTableTotalPages(totalPages);
          if (page > totalPages && totalPages > 0) {
            setTablePage(totalPages);
          }
        }
      } catch (err) {
        console.error("Error loading table tasks:", err);
      } finally {
        setTableTasksLoading(false);
      }
    },
    [buildTableTaskQuery]
  );

  const updateTaskInLists = useCallback((id: string, updater: (task: Task) => Task) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? updater(t) : t)));
    setTableTasks((prev) => prev.map((t) => (t.id === id ? updater(t) : t)));
  }, []);

  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const wid = getWid();
        const email = user?.email ?? "";
        const res = await fetch(
          `/api/project?wid=${wid}&email=${encodeURIComponent(email)}`
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.projects)) {
          setProjects(
            json.projects.map((p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading projects:", err);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (viewMode !== "table") return;
    loadTableTasks(tablePage);
  }, [viewMode, tablePage, loadTableTasks]);

  useEffect(() => {
    setTablePage(1);
  }, [searchQuery, filterPriority, filterAssignees, filterCategories, filterLabels, filterProjectId, taskModule]);

  const projectFilterOptions = useMemo(
    () => [
      { value: "all", label: "All projects" },
      ...projects.map((project) => ({ value: project.id, label: project.name })),
    ],
    [projects]
  );

  const selectedProjectName = useMemo(
    () => projects.find((project) => project.id === filterProjectId)?.name ?? null,
    [projects, filterProjectId]
  );

  const tableStartIndex = tableTotal === 0 ? 0 : (tablePage - 1) * DEFAULT_TASK_PAGE_SIZE + 1;
  const tableEndIndex = Math.min(tablePage * DEFAULT_TASK_PAGE_SIZE, tableTotal);

  // Modal & inline states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editModalTask, setEditModalTask] = useState<Task | null>(null);
  const [editModalSession, setEditModalSession] = useState(0);
  const [addModalSession, setAddModalSession] = useState(0);
  const [addModalDefaultStatus, setAddModalDefaultStatus] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Drawer Edit Form States
  const [isEditingTaskDetails, setIsEditingTaskDetails] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [detailDrawerTab, setDetailDrawerTab] = useState<"details" | "notes">("details");
  const [taskNotes, setTaskNotes] = useState<TaskNote[]>([]);
  const [taskNotesLoading, setTaskNotesLoading] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesModalDraft, setNotesModalDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<TaskNote | null>(null);
  const [tempStatus, setTempStatus] = useState<TaskStatus>("todo");
  const [tempPriority, setTempPriority] = useState<TaskPriority>("medium");
  const [tempAssignee, setTempAssignee] = useState("Unassigned");
  const [tempAssignees, setTempAssignees] = useState<string[]>([]);
  const [tempCategory, setTempCategory] = useState("General");

  const [tempDue, setTempDue] = useState("No date");
  const [tempAttachments, setTempAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);
  const detailAttachInputRef = useRef<HTMLInputElement>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    task: Task;
    newStatus: TaskStatus;
    previousStatus: TaskStatus;
  } | null>(null);
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [statusChangeSaving, setStatusChangeSaving] = useState(false);

  // Sync selected task to edit state
  useEffect(() => {
    if (selectedTask) {
      setTempTitle(selectedTask.title);
      setTempDescription(selectedTask.description || "");
      setDetailDrawerTab("details");
      setShowNotesModal(false);
      setEditingNoteId(null);
      setTaskNotes([]);
      setTempStatus(selectedTask.status || "todo");
      setTempPriority(selectedTask.priority || "medium");
      setTempAssignee(selectedTask.assignee || "Unassigned");
      setTempAssignees(selectedTask.assignees || []);
      setTempCategory(selectedTask.category || "General");

      setTempDue(selectedTask.due || "No date");
      setTempAttachments(urlsToAttachments(selectedTask.attachmentUrls));
      setIsEditingTaskDetails(false); // Default to read-only when opening
    }
  }, [selectedTask]);

  async function loadTaskNotes(taskId: string) {
    setTaskNotesLoading(true);
    try {
      const res = await fetch(`/api/task/notes?taskId=${encodeURIComponent(taskId)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.notes)) {
        setTaskNotes(json.notes);
      } else {
        setTaskNotes([]);
      }
    } catch (err) {
      console.error("Error loading task notes:", err);
      setTaskNotes([]);
    } finally {
      setTaskNotesLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedTask?.id) {
      setTaskNotes([]);
      return;
    }
    loadTaskNotes(selectedTask.id);
  }, [selectedTask?.id]);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const statusBeforeHoldRef = useRef<TaskStatus | null>(null);
  
  // Inline column add text inputs
  const [columnQuickAdd, setColumnQuickAdd] = useState<Record<string, string>>({
    todo: "",
    in_progress: "",
    on_hold: "",
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
      const identityKeys = new Set(currentUserAssigneeKeys);
      return tasks.filter((t) => {
        const assigneeCandidates = [t.assignee, ...(t.assignees || [])]
          .filter((value): value is string => Boolean(value))
          .map((value) => value.toLowerCase());
        return assigneeCandidates.some((candidate) => identityKeys.has(candidate));
      });
    }
    return tasks;
  }, [tasks, taskModule, currentUserAssigneeKeys]);

  // Apply search query and multi-filters
  const filteredTasks = useMemo(() => {
    return moduleTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = filterPriority === "All" ? true : task.priority === filterPriority;
      const matchesAssignee = filterAssignees.length === 0
        ? true
        : (task.assignees && task.assignees.length > 0
            ? task.assignees.some((a) => filterAssignees.includes(a))
            : filterAssignees.includes(task.assignee || "Unassigned"));
      const matchesCategory = filterCategories.length === 0 ? true : (task.category && filterCategories.includes(task.category));
      const matchesLabel = filterLabels.length === 0 ? true : (task.labels && task.labels.some((l) => filterLabels.includes(l)));
      const matchesProject =
        filterProjectId === "all" ? true : task.projectId === filterProjectId;

      return matchesSearch && matchesPriority && matchesAssignee && matchesCategory && matchesLabel && matchesProject;
    });
  }, [moduleTasks, searchQuery, filterPriority, filterAssignees, filterCategories, filterLabels, filterProjectId]);

  // Aggregate columns counts
  const columnsCounts = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, in_progress: 0, on_hold: 0, blocked: 0, overdue: 0, done: 0 };
    filteredTasks.forEach((t) => {
      const status = getEffectiveStatus(t);
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [filteredTasks]);

  // ── Core task mutation helpers ──────────────────────────────

  async function patchTask(id: string, fields: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch("/api/task", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return true;
    } catch (err) {
      console.error("Task PATCH error:", err);
      showToast("Failed to update task", "error" as any);
      return false;
    }
  }

  function applyStatusChange(id: string, newStatus: TaskStatus) {
    updateTaskInLists(id, (t) => ({ ...t, status: newStatus, done: newStatus === "done" }));
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus, done: newStatus === "done" } : null));
      if (isEditingTaskDetails) setTempStatus(newStatus);
    }
    patchTask(id, { status: newStatus, done: newStatus === "done" });
    if (newStatus === "done") {
      showToast("Task completed 🎉", "success");
    } else {
      showToast(`Task status updated to "${statusLabelMap[newStatus] || newStatus}"`, "info");
    }
  }

  async function saveStatusChangeNote(
    taskId: string,
    previousStatus: TaskStatus,
    newStatus: TaskStatus,
    note: string
  ) {
    if (!note.trim() || !currentUserEmail) return;

    const fromLabel = statusLabelMap[previousStatus] || previousStatus;
    const toLabel = statusLabelMap[newStatus] || newStatus;
    const content = `[${fromLabel} → ${toLabel}] ${note.trim()}`;

    try {
      const res = await fetch("/api/task/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          content,
          email: currentUserEmail,
        }),
      });
      const json = await res.json();
      if (json.success && json.note && selectedTask?.id === taskId) {
        setTaskNotes((prev) => [json.note, ...prev]);
      }
    } catch (err) {
      console.error("Status change note error:", err);
    }
  }

  function requestStatusChange(id: string, newStatus: TaskStatus) {
    if (!enforcePermission(canEditTasks)) return;
    const task = tasks.find((t) => t.id === id) ?? tableTasks.find((t) => t.id === id);
    if (!task) return;

    const previousStatus = getEffectiveStatus(task);
    if (newStatus === previousStatus) return;

    setStatusChangeNote("");
    setPendingStatusChange({ task, newStatus, previousStatus });
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) return;

    const { task, newStatus, previousStatus } = pendingStatusChange;
    const note = statusChangeNote.trim();
    setStatusChangeSaving(true);

    try {
      applyStatusChange(task.id, newStatus);
      await saveStatusChangeNote(task.id, previousStatus, newStatus, note);
      setPendingStatusChange(null);
      setStatusChangeNote("");
    } finally {
      setStatusChangeSaving(false);
    }
  }

  function cancelStatusChange() {
    setPendingStatusChange(null);
    setStatusChangeNote("");
  }

  function requestMarkComplete(task: Task) {
    if (task.done) return;
    requestStatusChange(task.id, "done");
  }

  function applyTaskIncomplete(id: string) {
    updateTaskInLists(id, (t) => ({ ...t, done: false, status: "todo" as TaskStatus }));
    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, done: false, status: "todo" } : null));
      setTempStatus("todo");
    }
    patchTask(id, { done: false, status: "todo" });
    showToast("Task marked as incomplete", "success");
  }

  function handleToggleDone(id: string) {
    if (!enforcePermission(canEditTasks)) return;
    const task = tasks.find((t) => t.id === id) ?? tableTasks.find((t) => t.id === id);
    if (!task) return;
    if (task.done) {
      applyTaskIncomplete(id);
    } else {
      requestMarkComplete(task);
    }
  }

  const statusLabelMap: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    on_hold: "On Hold",
    blocked: "Blocked",
    overdue: "Overdue",
    done: "Done"
  };

  function handleStatusChange(id: string, newStatus: TaskStatus) {
    requestStatusChange(id, newStatus);
  }

  function handleHoldToggle() {
    if (!enforcePermission(canEditTasks)) return;
    if (!selectedTask) return;
    if (selectedTask.status === "on_hold") {
      const restore = statusBeforeHoldRef.current || "todo";
      statusBeforeHoldRef.current = null;
      setTempStatus(restore);
      handleStatusChange(selectedTask.id, restore);
    } else {
      statusBeforeHoldRef.current = (selectedTask.status || "todo") as TaskStatus;
      setTempStatus("on_hold");
      handleStatusChange(selectedTask.id, "on_hold");
    }
  }

  function handlePriorityChange(id: string, newPriority: TaskPriority) {
    if (!enforcePermission(canEditTasks)) return;
    updateTaskInLists(id, (t) => ({ ...t, priority: newPriority }));
    if (selectedTask && selectedTask.id === id)
      setSelectedTask((prev) => prev ? { ...prev, priority: newPriority } : null);
    patchTask(id, { priority: newPriority });
    showToast(`Task priority set to "${priorityLabel(newPriority)}"`, "info");
  }

  function handleAssigneeChange(id: string, newAssignee: string) {
    if (!enforcePermission(canEditTasks)) return;
    updateTaskInLists(id, (t) => ({ ...t, assignee: newAssignee }));
    if (selectedTask && selectedTask.id === id)
      setSelectedTask((prev) => prev ? { ...prev, assignee: newAssignee } : null);
    patchTask(id, { assignee: newAssignee });
    showToast(`Task assigned to ${newAssignee}`, "info");
  }

  function handleCategoryChange(id: string, newCategory: string) {
    if (!enforcePermission(canEditTasks)) return;
    updateTaskInLists(id, (t) => ({ ...t, category: newCategory }));
    if (selectedTask && selectedTask.id === id)
      setSelectedTask((prev) => prev ? { ...prev, category: newCategory } : null);
    patchTask(id, { category: newCategory });
    showToast(`Task category set to "${newCategory}"`, "info");
  }



  const handleSaveTaskEdits = async () => {
    if (!enforcePermission(canEditTasks)) return;
    if (!selectedTask) return;
    if (!tempTitle.trim()) {
      showToast("Task title cannot be empty", "error");
      return;
    }

    const updates: Partial<Task> = {
      title: tempTitle.trim(),
      description: tempDescription.trim(),
      status: tempStatus,
      priority: tempPriority,
      assignee: tempAssignees.length > 0 ? tempAssignees[0] : "Unassigned",
      assignees: tempAssignees,
      category: tempCategory,

      due: tempDue,
      attachmentUrls: tempAttachments.map((a) => a.dataUrl),
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? { ...t, ...updates, done: tempStatus === "done" } : t))
    );
    setSelectedTask((prev) => prev ? { ...prev, ...updates, done: tempStatus === "done" } : null);

    await patchTask(selectedTask.id, {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      assignee: updates.assignee,
      assignees: updates.assignees,
      category: updates.category,
      due: updates.due,
      done: updates.status === "done",
      attachmentUrls: updates.attachmentUrls,
    });

    setIsEditingTaskDetails(false);
    showToast("Task changes saved successfully!", "success");
  };

  const handleCancelTaskEdits = () => {
    if (!selectedTask) return;
    setTempTitle(selectedTask.title);
    setTempDescription(selectedTask.description || "");
    setTempStatus(selectedTask.status || "todo");
    setTempPriority(selectedTask.priority || "medium");
    setTempAssignee(selectedTask.assignee || "Unassigned");
    setTempAssignees(selectedTask.assignees || []);
    setTempCategory(selectedTask.category || "General");

    setTempDue(selectedTask.due || "No date");
    setTempAttachments(urlsToAttachments(selectedTask.attachmentUrls));
    setIsEditingTaskDetails(false);
  };

  function openNotesModal(note?: TaskNote) {
    if (!enforcePermission(canEditTasks)) return;
    if (!selectedTask) return;
    if (note) {
      setEditingNoteId(note.id);
      setNotesModalDraft(note.content);
    } else {
      setEditingNoteId(null);
      setNotesModalDraft("");
    }
    setShowNotesModal(true);
  }

  async function handleSaveNotesModal() {
    if (!enforcePermission(canEditTasks)) return;
    if (!selectedTask) return;
    const content = notesModalDraft.trim();
    if (!content) {
      showToast("Note cannot be empty", "error" as any);
      return;
    }

    setNotesSaving(true);
    try {
      if (editingNoteId) {
        const res = await fetch("/api/task/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingNoteId, content }),
        });
        const json = await res.json();
        if (json.success && json.note) {
          setTaskNotes((prev) =>
            prev.map((n) => (n.id === editingNoteId ? json.note : n))
          );
          setShowNotesModal(false);
          setEditingNoteId(null);
          showToast("Note updated", "success");
        } else {
          showToast(json.error || "Failed to update note", "error" as any);
        }
      } else {
        if (!currentUserEmail) {
          showToast("Sign in to add notes", "error" as any);
          return;
        }
        const res = await fetch("/api/task/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: selectedTask.id,
            content,
            email: currentUserEmail,
          }),
        });
        const json = await res.json();
        if (json.success && json.note) {
          setTaskNotes((prev) => [json.note, ...prev]);
          setShowNotesModal(false);
          showToast("Note added", "success");
        } else {
          showToast(json.error || "Failed to add note", "error" as any);
        }
      }
    } catch (err) {
      console.error("Save note error:", err);
      showToast("Failed to save note", "error" as any);
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleDeleteNote(note: TaskNote) {
    if (!enforcePermission(canEditTasks)) return;
    try {
      const res = await fetch(`/api/task/notes?id=${encodeURIComponent(note.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setTaskNotes((prev) => prev.filter((n) => n.id !== note.id));
        setNoteToDelete(null);
        showToast("Note deleted", "success");
      } else {
        showToast(json.error || "Failed to delete note", "error" as any);
      }
    } catch (err) {
      console.error("Delete note error:", err);
      showToast("Failed to delete note", "error" as any);
    }
  }

  async function handleDetailFilesSelected(files: FileList | null) {
    if (!files?.length) return;

    setAttachmentsUploading(true);
    try {
      const wid = getWid();
      for (const file of Array.from(files)) {
        const uploaded = await uploadFileToStorage(file, {
          workspaceId: wid,
          folder: "attachments",
        });
        setTempAttachments((prev) => [
          ...prev,
          {
            name: uploaded.name,
            size: uploaded.size,
            dataUrl: uploaded.url,
          },
        ]);
      }
    } catch (err: unknown) {
      console.error("Task attachment upload error:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to upload attachment",
        "error" as any
      );
    } finally {
      setAttachmentsUploading(false);
    }
  }

  async function handleDownloadAttachment(att: TaskAttachment) {
    try {
      await downloadAttachmentFile(att);
    } catch (err) {
      console.error("Download attachment error:", err);
      showToast("Failed to download attachment", "error" as any);
    }
  }

  function handleTitleChange(id: string, newTitle: string) {
    if (!enforcePermission(canEditTasks)) return;
    if (!newTitle.trim()) return;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, title: newTitle } : t));
    patchTask(id, { title: newTitle });
  }

  function handleDescriptionChange(id: string, newDesc: string) {
    if (!enforcePermission(canEditTasks)) return;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, description: newDesc } : t));
    // Debounced in drawer – patchTask called on blur (see drawer textarea)
  }

  async function handleTaskDelete(id: string) {
    if (!enforcePermission(canDeleteTasks)) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setTableTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
    try {
      const res = await fetch(`/api/task?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Task deleted successfully.", "info");
      if (viewMode === "table") {
        const nextPage =
          tableTasks.length <= 1 && tablePage > 1 ? tablePage - 1 : tablePage;
        if (nextPage !== tablePage) setTablePage(nextPage);
        else await loadTableTasks(tablePage);
      }
      await loadAllTasks();
    } catch (err) {
      console.error("Task DELETE error:", err);
      showToast("Failed to delete task", "error" as any);
      await loadAllTasks();
      if (viewMode === "table") await loadTableTasks(tablePage);
    }
  }

  // ── Create task (modal) ────────────────────────────────────
  function openTableTaskEdit(task: Task) {
    if (!enforcePermission(canEditTasks)) return;
    setEditModalTask(task);
    setEditModalSession((s) => s + 1);
    setEditOpen(true);
  }

  async function handleUpdateTaskFromModal(taskId: string, payload: NewTaskPayload) {
    if (!enforcePermission(canEditTasks)) return;

    const updates: Partial<Task> = {
      title: payload.title,
      description: payload.description || undefined,
      status: payload.status,
      priority: payload.priority,
      assignee: payload.assignees.length > 0 ? payload.assignees[0] : "Unassigned",
      assignees: payload.assignees,
      category: payload.category,
      labels: payload.labels.length ? payload.labels : undefined,
      due: payload.dueLabel,
      done: payload.status === "done",
      attachmentUrls: payload.attachmentUrls || [],
      projectId: payload.projectId ?? null,
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    setTableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    }

    const ok = await patchTask(taskId, {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      assignee: updates.assignee,
      assignees: updates.assignees,
      category: updates.category,
      labels: updates.labels,
      due: updates.due,
      done: updates.done,
      attachmentUrls: updates.attachmentUrls,
      projectId: payload.projectId ?? null,
    });

    if (ok) {
      showToast(`Task "${payload.title}" updated`, "success");
      if (viewMode === "table") await loadTableTasks(tablePage);
      await loadAllTasks();
    }
  }

  async function handleAddTaskFromModal(payload: NewTaskPayload) {
    if (!enforcePermission(canCreateTasks)) return;
    if (!enforceTaskCreationLimit()) return;
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
      assignee: payload.assignees && payload.assignees.length > 0 ? payload.assignees[0] : "Unassigned",
      assignees: payload.assignees || [],
      status: payload.status,
      done: payload.status === "done",
      attachmentUrls: payload.attachmentUrls || [],
      projectId: payload.projectId ?? null,
      createdAt: new Date().toISOString(),
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
          assignee: payload.assignees && payload.assignees.length > 0 ? payload.assignees[0] : "Unassigned",
          assignees: payload.assignees || [],
          projectId: payload.projectId,
          attachmentUrls: payload.attachmentUrls || [],
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
        if (viewMode === "table") {
          setTablePage(1);
          await loadTableTasks(1);
        }
        await loadAllTasks();
      } else {
        if (isUpgradeRequiredError(json)) {
          setTasks((prev) => prev.filter((t) => t.id !== tempId));
          guardPlanFeature(json.feature || "tasksLimit", json.error);
          return;
        }
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
    if (!enforcePermission(canCreateTasks)) return;
    if (!enforceTaskCreationLimit()) return;
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
      createdAt: new Date().toISOString(),
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
        if (viewMode === "table") await loadTableTasks(tablePage);
        await loadAllTasks();
      } else {
        if (isUpgradeRequiredError(json)) {
          setTasks((prev) => prev.filter((t) => t.id !== tempId));
          guardPlanFeature(json.feature || "tasksLimit", json.error);
          return;
        }
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
    setFilterProjectId("all");
  }

  const hasActiveFilters =
    searchQuery !== "" ||
    filterPriority !== "All" ||
    filterAssignees.length > 0 ||
    filterCategories.length > 0 ||
    filterLabels.length > 0 ||
    filterProjectId !== "all";

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
              Active: {viewMode === "table" ? tableTotal : filteredTasks.length}
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
            <div className="min-w-[10.5rem]">
              <AppSelect
                value={filterProjectId}
                onChange={setFilterProjectId}
                options={projectFilterOptions}
                placeholder="All projects"
                size="sm"
                emptyMessage="No projects yet"
                className="w-full"
              />
            </div>

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
                if (!enforcePermission(canCreateTasks)) return;
                if (!enforceTaskCreationLimit()) return;
                setAddModalSession((s) => s + 1);
                setAddOpen(true);
              }}
              disabled={!canCreateTasks}
              title={!canCreateTasks ? "Requires create task permission" : "Add task"}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-45 lg:px-5"
            >
              <PlusIcon className="h-4 w-4" />
              Add task
            </motion.button>
          </div>
        </div>

        {/* Active Filter Badges Display */}
        {(filterPriority !== "All" || filterAssignees.length > 0 || filterCategories.length > 0 || filterLabels.length > 0 || filterProjectId !== "all" || searchQuery !== "") && (
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
                <span className="text-zinc-450 font-normal">{priorityLabel(filterPriority)}</span>
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
 
            {filterProjectId !== "all" && selectedProjectName && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-655 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300">
                <span>Project:</span>
                <span className="text-zinc-450 font-normal">{selectedProjectName}</span>
                <button onClick={() => setFilterProjectId("all")} className="text-zinc-450 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            )}

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
              {dynamicColumns.map((col) => {
                const columnTasks = filteredTasks.filter((t) => getEffectiveStatus(t) === col.id);
                const isOver = dragOverColumn === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`flex h-full min-h-[400px] w-72 shrink-0 flex-col rounded-2xl border-2 transition-all duration-200 ${col.bg} ${
                      isOver
                        ? "border-[var(--app-primary)] shadow-[0_0_0_3px_rgba(13,148,136,0.15)] scale-[1.01]"
                        : `${col.border} ${col.darkBorder} shadow-sm`
                    }`}
                  >
                    
                    {/* Lane Header */}
                    <div className={`flex shrink-0 items-center justify-between px-3 py-3 border-b ${col.headerBorder ?? "border-b-zinc-200/40 dark:border-b-white/[0.04]"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                        <span className="font-heading text-[14px] font-bold text-zinc-800 dark:text-zinc-100">
                          {col.label}
                        </span>
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-zinc-200/70 px-1 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {columnTasks.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {currentColumnOrder.indexOf(col.id) > 0 && (
                          <button
                            type="button"
                            onClick={() => moveColumn(col.id, "left")}
                            disabled={!canReorderColumns}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                            title="Move column left"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                        )}
                        {currentColumnOrder.indexOf(col.id) < currentColumnOrder.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveColumn(col.id, "right")}
                            disabled={!canReorderColumns}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                            title="Move column right"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!enforcePermission(canCreateTasks)) return;
                            setAddModalDefaultStatus(col.id);
                            setAddModalSession((s) => s + 1);
                            setAddOpen(true);
                          }}
                          disabled={!canCreateTasks}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          title={`Add task to ${col.label}`}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
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
                          className="group relative min-w-0 cursor-grab overflow-hidden rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm shadow-zinc-200/40 hover:border-zinc-300/80 active:cursor-grabbing hover:shadow-[0_4px_16px_-4px_rgba(24,24,27,0.06)] dark:border-white/[0.05] dark:bg-zinc-900/90 dark:shadow-none dark:hover:border-zinc-700 transition-[border-color,box-shadow]"
                        >
                          {/* Card Top Row: Category & Priority */}
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="min-w-0 flex-1 truncate text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              {task.category || "General"}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-zinc-600 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-300">
                              <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(task.priority)}`} />
                              {priorityLabel(task.priority)}
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4
                            className="mt-2 truncate text-[13px] font-semibold leading-snug tracking-tight text-zinc-900 group-hover:text-[var(--app-primary)] dark:text-zinc-100 dark:group-hover:text-teal-400 transition-colors"
                            title={task.title}
                          >
                            {task.title}
                          </h4>

                          {/* Task Description snippet */}
                          {task.description && (
                            <p
                              className="mt-1 line-clamp-2 break-all text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400"
                              title={task.description}
                            >
                              {task.description}
                            </p>
                          )}

                          {/* Meta row: estimate + assignee hint */}
                          {(task.estimate || (task.assignees?.length ?? 0) > 0 || task.assignee) && (
                            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              {task.estimate && (
                                <span className="inline-flex max-w-full items-center gap-1 truncate text-[10px] font-medium text-zinc-450 dark:text-zinc-500">
                                  <ClockIcon className="h-3 w-3 shrink-0 opacity-70" />
                                  <span className="truncate">{task.estimate}</span>
                                </span>
                              )}
                              {(task.assignees?.length ?? 0) > 0 || task.assignee ? (
                                <span className="inline-flex max-w-full items-center gap-1 truncate text-[10px] font-medium text-zinc-450 dark:text-zinc-500">
                                  <UserIcon className="h-3 w-3 shrink-0 opacity-70" />
                                  <span className="truncate">
                                    {task.assignees && task.assignees.length > 0
                                      ? task.assignees.length > 1
                                        ? `${task.assignees[0]} +${task.assignees.length - 1}`
                                        : task.assignees[0]
                                      : task.assignee}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          )}

                          {/* Labels list */}
                          {task.labels && task.labels.length > 0 && (
                            <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                              {task.labels.slice(0, 3).map((label) => (
                                <span
                                  key={label}
                                  className="max-w-[88px] truncate rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-700/50"
                                  title={label}
                                >
                                  {label}
                                </span>
                              ))}
                              {task.labels.length > 3 && (
                                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-700/50">
                                  +{task.labels.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Card Footer: Due Date, Attachments & Assignee */}
                          <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 dark:border-white/[0.03]">
                            
                            {/* Due Date + Attachments */}
                            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                              {task.due && task.due !== "No date" && (
                                <span
                                  className={`inline-flex min-w-0 max-w-full items-center gap-1 truncate text-[10px] font-medium ${
                                  task.due.includes("Today") || task.due.includes("Urgent") || task.due.includes("Yesterday")
                                    ? "text-rose-500 font-semibold"
                                    : "text-zinc-400"
                                }`}
                                  title={task.due}
                                >
                                  <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                  <span className="truncate">{task.due}</span>
                                </span>
                              )}
                              {task.attachmentUrls && task.attachmentUrls.length > 0 && (
                                <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                                  <PaperClipIcon className="h-3 w-3" />
                                  {task.attachmentUrls.length}
                                </span>
                              )}
                            </div>

                            {/* Assignee Avatar / Avatars Group */}
                            <div className="shrink-0">
                            {task.assignees && task.assignees.length > 0 ? (
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {task.assignees.slice(0, 3).map((a) => (
                                  <div key={a} className="scale-[0.85] origin-center ring-1 ring-white dark:ring-zinc-900 rounded-full shrink-0">
                                    {getAvatar(a)}
                                  </div>
                                ))}
                                {task.assignees.length > 3 && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[8px] font-bold text-zinc-650 dark:bg-zinc-800 dark:text-zinc-450 ring-1 ring-white dark:ring-zinc-900 shrink-0">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              getAvatar(task.assignee || "Unassigned")
                            )}
                            </div>
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
                              disabled={!canCreateTasks || !columnQuickAdd[col.id]?.trim()}
                              className="bg-[var(--app-primary)] text-white px-2.5 py-1 rounded text-[10px] font-semibold disabled:opacity-45 hover:bg-[var(--app-primary-hover)]"
                            >
                              Add card
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!enforcePermission(canCreateTasks)) return;
                            setAddModalDefaultStatus(col.id);
                            setAddModalSession((s) => s + 1);
                            setAddOpen(true);
                          }}
                          disabled={!canCreateTasks}
                          title={!canCreateTasks ? "Requires create task permission" : "Add a card"}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-zinc-500 hover:bg-white hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800 transition-colors cursor-pointer"
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
              className="flex h-full w-full flex-col overflow-hidden select-none"
            >
              <div className="relative flex-1 overflow-auto px-6 py-4 scrollbar-thin">
                {tableTasksLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-zinc-900/60">
                    <ArrowPathIcon className="h-7 w-7 animate-spin text-zinc-400" />
                  </div>
                )}
              <div className="min-w-[950px] inline-block align-middle w-full rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/60">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-zinc-200/80 dark:border-white/[0.06] bg-stone-50/50 dark:bg-zinc-900/40 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 h-10">
                      <th className="w-[4%] text-center pl-3">Done</th>
                      <th className="w-[33%] px-4">Task Name</th>
                      <th className="w-[11%] px-3">Status</th>
                      <th className="w-[11%] px-3">Priority</th>
                      <th className="w-[13%] px-3">Assignee</th>
                      <th className="w-[11%] px-3">Category</th>
                      <th className="w-[12%] px-3">Due Date</th>
                      <th className="w-[5%] text-center pr-3">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-zinc-200/50 dark:divide-white/[0.04]">
                    {tableTasks.map((task) => (
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
                              onClick={() => openTableTaskEdit(task)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-750 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-all ml-1"
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
                            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 text-zinc-705 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <span>{dynamicColumns.find(c => c.id === task.status)?.label || "To Do"}</span>
                            <ChevronDownIcon className="h-3 w-3 opacity-60" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "status" && (
                            <div className="absolute left-3 top-10 z-30 w-36 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                              {dynamicColumns.map((col) => (
                                <button
                                  key={col.id}
                                  type="button"
                                  onClick={() => {
                                    handleStatusChange(task.id, col.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex w-full items-center px-3 py-1.5 text-xs text-zinc-705 hover:bg-stone-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  {col.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 4. Inline Priority selector — matches Add Task / Kanban (dot + label) */}
                        <td className="px-3 relative" ref={activeDropdown?.taskId === task.id && activeDropdown?.field === "priority" ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown?.field === "priority" ? null : { taskId: task.id, field: "priority" })}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(task.priority)}`} />
                            <span>{priorityLabel(task.priority)}</span>
                            <ChevronDownIcon className="h-3 w-3 opacity-60" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "priority" && (
                            <div className="absolute left-3 top-10 z-30 w-40 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                              {TASK_PRIORITY_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    handlePriorityChange(task.id, opt.value);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-zinc-705 hover:bg-stone-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                                  {opt.label}
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
                            {task.assignees && task.assignees.length > 0 ? (
                              <div className="flex -space-x-1.5 overflow-hidden mr-1 shrink-0">
                                {task.assignees.slice(0, 2).map((a) => (
                                  <div key={a} className="ring-1 ring-white dark:ring-zinc-900 rounded-full">
                                    {getAvatar(a)}
                                  </div>
                                ))}
                                {task.assignees.length > 2 && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[8px] font-black text-zinc-650 dark:bg-zinc-800 dark:text-zinc-450 ring-1 ring-white dark:ring-zinc-900 shrink-0">
                                    +{task.assignees.length - 2}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mr-1 shrink-0">{getAvatar(task.assignee || "Unassigned")}</div>
                            )}
                            <span className="truncate text-xs font-medium max-w-[70px]">
                              {task.assignees && task.assignees.length > 0 ? task.assignees[0] : (task.assignee || "Unassigned")}
                            </span>
                            <ChevronDownIcon className="h-3 w-3 opacity-40 shrink-0" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "assignee" && (
                            <div className="absolute left-3 top-10 z-30 w-44 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                              {assigneesList.map((assignee) => {
                                const isSelected = task.assignees ? task.assignees.includes(assignee) : task.assignee === assignee;
                                return (
                                  <button
                                    key={assignee}
                                    type="button"
                                    onClick={() => {
                                      let newAssignees: string[];
                                      if (assignee === "Unassigned") {
                                        newAssignees = [];
                                      } else {
                                        const currentAssignees = task.assignees || (task.assignee ? [task.assignee] : []);
                                        if (currentAssignees.includes(assignee)) {
                                          newAssignees = currentAssignees.filter(a => a !== assignee);
                                        } else {
                                          newAssignees = [...currentAssignees.filter(a => a !== "Unassigned"), assignee];
                                        }
                                      }
                                      updateTaskInLists(task.id, (t) => ({
                                        ...t,
                                        assignees: newAssignees,
                                        assignee: newAssignees.length > 0 ? newAssignees[0] : "Unassigned",
                                      }));
                                      patchTask(task.id, {
                                        assignees: newAssignees,
                                        assignee: newAssignees.length > 0 ? newAssignees[0] : "Unassigned"
                                      });
                                    }}
                                    className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-zinc-705 hover:bg-stone-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                  >
                                    <span className="truncate">{assignee}</span>
                                    {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[2.5]" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* 7. Inline Category selector */}
                        <td className="px-3 relative" ref={activeDropdown?.taskId === task.id && activeDropdown?.field === "category" ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown?.field === "category" ? null : { taskId: task.id, field: "category" })}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-505 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
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
                        <td className="px-3 text-xs text-zinc-550 dark:text-zinc-400 truncate">
                          {task.due}
                        </td>

                        {/* 9. Actions Column (3-dots) */}
                        <td className="px-3 text-center relative pr-3" ref={activeDropdown?.taskId === task.id && activeDropdown?.field === "actions" ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown?.field === "actions" ? null : { taskId: task.id, field: "actions" })}
                            className="p-1.5 rounded-lg text-zinc-400 hover:bg-stone-100 hover:text-zinc-750 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                            title="Task Actions"
                          >
                            <EllipsisVerticalIcon className="h-4.5 w-4.5 mx-auto" />
                          </button>
                          {activeDropdown?.taskId === task.id && activeDropdown?.field === "actions" && (
                            <div className="absolute right-3 top-10 z-30 w-32 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsEditingTaskDetails(false);
                                  setActiveDropdown(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-705 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                <EyeIcon className="h-4 w-4 text-zinc-400" />
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  openTableTaskEdit(task);
                                  setActiveDropdown(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-705 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                <PencilIcon className="h-4 w-4 text-zinc-400" />
                                Edit
                              </button>
                              <div className="my-1 border-t border-zinc-100 dark:border-white/5" />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!enforcePermission(canDeleteTasks)) return;
                                  setTaskToDelete(task);
                                  setActiveDropdown(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              >
                                <TrashIcon className="h-4 w-4 text-rose-500" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {!tableTasksLoading && tableTasks.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-zinc-400 dark:text-zinc-500">
                          No tasks match the search or filter query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>

              <div className="shrink-0 border-t border-zinc-200 bg-zinc-50/50 px-6 py-3.5 flex items-center justify-between dark:border-white/10 dark:bg-zinc-900/50">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {tableTotal === 0 ? (
                    "No tasks to show"
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-zinc-950 dark:text-zinc-50">{tableStartIndex}</span>
                      {" "}to{" "}
                      <span className="font-semibold text-zinc-950 dark:text-zinc-50">{tableEndIndex}</span>
                      {" "}of{" "}
                      <span className="font-semibold text-zinc-950 dark:text-zinc-50">{tableTotal}</span>
                      {" "}tasks
                    </>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Page {tablePage} of {tableTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                    disabled={tablePage === 1 || tableTasksLoading}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setTablePage((p) => Math.min(p + 1, tableTotalPages))}
                    disabled={tablePage >= tableTotalPages || tableTotal === 0 || tableTasksLoading}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Next
                  </button>
                </div>
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
              className="absolute inset-y-0 right-0 z-50 flex h-full w-full max-w-[480px] min-w-0 flex-col overflow-hidden border-l border-zinc-200 bg-[var(--background)] shadow-2xl dark:border-white/[0.08] dark:bg-zinc-900"
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
                    onClick={() => {
                      if (!enforcePermission(canEditTasks)) return;
                      setDetailDrawerTab("notes");
                      openNotesModal();
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/30 dark:hover:text-teal-400 transition-colors"
                    title="Add or edit notes"
                  >
                    <DocumentTextIcon className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!enforcePermission(canEditTasks)) return;
                      openTableTaskEdit(selectedTask);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title="Edit Task"
                  >
                    <PencilIcon className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!enforcePermission(canDeleteTasks)) return;
                      setTaskToDelete(selectedTask);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-505 dark:hover:bg-rose-950/20 transition-colors"
                    title="Delete task"
                  >
                    <TrashIcon className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTask(null);
                      setIsEditingTaskDetails(false);
                    }}
                    className="rounded-lg border border-zinc-200/80 p-1.5 text-zinc-505 transition-colors hover:bg-white hover:text-zinc-800 dark:border-white/[0.08] dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    aria-label="Close panel"
                  >
                    <XMarkIcon className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Drawer scroll area */}
              <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
                {/* Title */}
                <div className="min-w-0 space-y-1.5 pb-4 pt-6">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Title
                  </label>
                  {isEditingTaskDetails ? (
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className="w-full text-base font-bold bg-transparent border-b border-zinc-200 focus:border-[var(--app-primary)] py-1.5 outline-none tracking-tight text-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:focus:border-teal-500 transition-colors"
                    />
                  ) : (
                    <div
                      className="min-w-0 overflow-hidden py-1.5 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
                      title={selectedTask.title}
                    >
                      {truncateWithEllipsis(selectedTask.title, SIDEBAR_TITLE_MAX_CHARS)}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="sticky top-0 z-10 -mx-6 flex gap-1 border-b border-zinc-200/80 bg-[var(--background)] px-6 dark:border-white/[0.06] dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setDetailDrawerTab("details")}
                    className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-colors ${
                      detailDrawerTab === "details"
                        ? "text-[var(--app-primary)] dark:text-teal-400"
                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    Details
                    {detailDrawerTab === "details" && (
                      <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--app-primary)] dark:bg-teal-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailDrawerTab("notes")}
                    className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-colors ${
                      detailDrawerTab === "notes"
                        ? "text-[var(--app-primary)] dark:text-teal-400"
                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    Notes
                    {taskNotes.length > 0 && (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                        {taskNotes.length}
                      </span>
                    )}
                    {detailDrawerTab === "notes" && (
                      <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--app-primary)] dark:bg-teal-400" />
                    )}
                  </button>
                </div>

                <div className="min-w-0 space-y-6 py-6">
                {detailDrawerTab === "details" ? (
                <>
                {/* Description (Interactive edit) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Description
                  </label>
                  {isEditingTaskDetails ? (
                    <textarea
                      rows={4}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      placeholder="Describe this task in detail so others can pick it up..."
                      className="w-full text-xs font-normal text-zinc-800 leading-relaxed bg-white border border-zinc-200 rounded-xl p-3 outline-none focus:border-zinc-400 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:bg-zinc-950/40 dark:border-white/[0.08] dark:text-zinc-200 dark:focus:border-zinc-700 transition-[border-color,box-shadow]"
                    />
                  ) : selectedTask.description ? (
                    <div
                      className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 shadow-inner dark:border-white/10 dark:bg-zinc-900/50"
                      title={selectedTask.description}
                    >
                      <p className="line-clamp-5 overflow-hidden text-xs leading-relaxed text-zinc-600 [overflow-wrap:anywhere] break-words dark:text-zinc-300">
                        {selectedTask.description}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs italic text-zinc-400 shadow-inner dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-500">
                      No description provided.
                    </div>
                  )}
                </div>

                {/* Metadata attributes list */}
                <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/50 space-y-4">
                  
                  <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-505 dark:text-zinc-400 pb-2 border-b border-zinc-100 dark:border-white/[0.03]">
                    Attributes
                  </h5>

                  {/* Attribute: Status */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</span>
                    <div className="col-span-2 select-none">
                      {isEditingTaskDetails ? (
                        <CustomSelect
                          value={tempStatus}
                          onChange={(val) => setTempStatus(val as TaskStatus)}
                          options={[
                            { value: "todo", label: "To Do", colorDot: "bg-zinc-450" },
                            { value: "in_progress", label: "In Progress", colorDot: "bg-teal-500" },
                            { value: "on_hold", label: "On Hold", colorDot: "bg-amber-500" },
                            { value: "blocked", label: "Blocked", colorDot: "bg-rose-505" },
                            { value: "overdue", label: "Overdue", colorDot: "bg-red-600" },
                            { value: "done", label: "Done", colorDot: "bg-emerald-500" }
                          ]}
                        />
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            getEffectiveStatus(selectedTask) === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40" :
                            getEffectiveStatus(selectedTask) === "in_progress" ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-900/40" :
                            getEffectiveStatus(selectedTask) === "on_hold" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40" :
                            getEffectiveStatus(selectedTask) === "blocked" ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40" :
                            getEffectiveStatus(selectedTask) === "overdue" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40" :
                            "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              getEffectiveStatus(selectedTask) === "done" ? "bg-emerald-500" :
                              getEffectiveStatus(selectedTask) === "in_progress" ? "bg-teal-500" :
                              getEffectiveStatus(selectedTask) === "on_hold" ? "bg-amber-500" :
                              getEffectiveStatus(selectedTask) === "blocked" ? "bg-rose-500" :
                              getEffectiveStatus(selectedTask) === "overdue" ? "bg-red-600" :
                              "bg-zinc-400"
                            }`} />
                            {statusLabelMap[getEffectiveStatus(selectedTask)] || "To Do"}
                          </span>
                          {taskShowsOverdueBadge(selectedTask) && (
                            <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                              Past due
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* On Hold quick toggle */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">On Hold</span>
                    <div className="col-span-2 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-zinc-450 dark:text-zinc-500">
                        {selectedTask.status === "on_hold"
                          ? "Paused — toggle off to resume"
                          : "Pause this task temporarily"}
                      </p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={selectedTask.status === "on_hold"}
                        onClick={handleHoldToggle}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                          selectedTask.status === "on_hold"
                            ? "bg-amber-500"
                            : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                            selectedTask.status === "on_hold" ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Attribute: Priority */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Priority</span>
                    <div className="col-span-2">
                      {isEditingTaskDetails ? (
                        <CustomSelect
                          value={tempPriority}
                          onChange={(val) => setTempPriority(val as TaskPriority)}
                          options={TASK_PRIORITY_OPTIONS.map((o) => ({
                            value: o.value,
                            label: o.label,
                            colorDot: o.dot,
                          }))}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-300">
                          <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(selectedTask.priority)}`} />
                          {priorityLabel(selectedTask.priority)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attribute: Assignee */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Assignee</span>
                    <div className="col-span-2">
                      {isEditingTaskDetails ? (
                        <CustomMultiSelect
                          value={tempAssignees}
                          onChange={(val) => setTempAssignees(val)}
                          options={assigneesList.map((a) => {
                            const initials = a === "Me" ? "ME" : a === "Unassigned" ? "UN" : a.trim().split(/\s+/).map(n => n[0]).join("").toUpperCase().slice(0, 2);
                            return {
                              value: a,
                              label: a,
                              icon: (
                                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-100 text-[8px] font-black text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 shrink-0">
                                  {initials}
                                </span>
                              )
                            };
                          })}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {selectedTask.assignees.slice(0, 3).map((a) => (
                                  <div key={a} className="ring-2 ring-white dark:ring-zinc-900 rounded-full">
                                    {getAvatar(a)}
                                  </div>
                                ))}
                                {selectedTask.assignees.length > 3 && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-black text-zinc-650 dark:bg-zinc-800 dark:text-zinc-450 ring-2 ring-white dark:ring-zinc-900 shrink-0">
                                    +{selectedTask.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300 truncate max-w-[150px]" title={selectedTask.assignees.join(", ")}>
                                {selectedTask.assignees.join(", ")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {getAvatar(selectedTask.assignee || "Unassigned")}
                              <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300">{selectedTask.assignee || "Unassigned"}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attribute: Category */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</span>
                    <div className="col-span-2">
                      {isEditingTaskDetails ? (
                        <CustomSelect
                          value={tempCategory}
                          onChange={(val) => setTempCategory(val)}
                          options={(customCategories || []).map((cat) => ({
                            value: cat,
                            label: cat
                          }))}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-xs font-bold text-indigo-650 border border-indigo-100/50 dark:bg-indigo-950/30 dark:text-indigo-350 dark:border-indigo-900/30">
                          {selectedTask.category || "General"}
                        </span>
                      )}
                    </div>
                  </div>



                  {/* Attribute: Due Date */}
                  <div className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Due Label</span>
                    <div className="col-span-2">
                      {isEditingTaskDetails ? (
                        <input
                          type="text"
                          value={tempDue}
                          onChange={(e) => setTempDue(e.target.value)}
                          className="w-full text-xs font-semibold text-zinc-700 bg-stone-50 border border-zinc-200 p-2 rounded-lg outline-none focus:bg-white dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 border border-zinc-200/50 dark:bg-zinc-900 dark:border-white/5 px-2.5 py-1 rounded-lg">
                          {selectedTask.due || "No date"}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Attachments */}
                <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/[0.03]">
                    <div className="flex items-center gap-2">
                      <PaperClipIcon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-505 dark:text-zinc-400">
                        Attachments
                      </h5>
                      {(isEditingTaskDetails ? tempAttachments : urlsToAttachments(selectedTask.attachmentUrls)).length > 0 && (
                        <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                          {(isEditingTaskDetails ? tempAttachments : urlsToAttachments(selectedTask.attachmentUrls)).length}
                        </span>
                      )}
                    </div>
                    {isEditingTaskDetails && (
                      <>
                        <button
                          type="button"
                          onClick={() => detailAttachInputRef.current?.click()}
                          disabled={attachmentsUploading}
                          className="flex items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/10 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PaperClipIcon className="h-3 w-3" />
                          {attachmentsUploading ? "Uploading…" : "Add files"}
                        </button>
                        <input
                          ref={detailAttachInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          disabled={attachmentsUploading}
                          onChange={(e) => {
                            void handleDetailFilesSelected(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Max 2 MB per file. Images are auto-compressed before upload.
                  </p>

                  {(() => {
                    const list = isEditingTaskDetails
                      ? tempAttachments
                      : urlsToAttachments(selectedTask.attachmentUrls);

                    if (list.length === 0) {
                      return (
                        <p className="text-xs text-zinc-450 dark:text-zinc-500 py-1">
                          {isEditingTaskDetails
                            ? "No attachments yet. Use “Add files” to upload."
                            : "No attachments on this task."}
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {list.map((att, idx) => {
                          const previewUrl = resolveStorageUrl(att.dataUrl);
                          const isImage = isImageStorageFile(att.dataUrl, att.name);

                          if (isImage) {
                            return (
                              <div
                                key={`${att.name}-${idx}`}
                                className="overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-white/[0.06] dark:bg-zinc-900/60"
                              >
                                <button
                                  type="button"
                                  onClick={() => openAttachment(att)}
                                  className="block w-full text-left"
                                  title="Preview image"
                                >
                                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={previewUrl}
                                      alt={att.name}
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                </button>
                                <div className="flex items-center gap-2 px-3 py-2">
                                  <PaperClipIcon className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                  <button
                                    type="button"
                                    onClick={() => openAttachment(att)}
                                    className="flex-1 truncate text-left text-[11px] font-semibold text-zinc-700 hover:text-[var(--app-primary)] dark:text-zinc-300 dark:hover:text-teal-400 transition-colors"
                                    title="Preview image"
                                  >
                                    {att.name}
                                  </button>
                                  <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {formatAttachmentSize(att.size)}
                                  </span>
                                  {!isEditingTaskDetails && (
                                    <button
                                      type="button"
                                      onClick={() => void handleDownloadAttachment(att)}
                                      className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                                      title="Download"
                                    >
                                      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {isEditingTaskDetails && (
                                    <button
                                      type="button"
                                      onClick={() => setTempAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                      className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
                                      title="Remove attachment"
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                          <div
                            key={`${att.name}-${idx}`}
                            className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-white/[0.06] dark:bg-zinc-900/60"
                          >
                            <PaperClipIcon className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                            <button
                              type="button"
                              onClick={() => openAttachment(att)}
                              className="flex-1 truncate text-left text-[11px] font-semibold text-zinc-700 hover:text-[var(--app-primary)] dark:text-zinc-300 dark:hover:text-teal-400 transition-colors"
                              title="Open file"
                            >
                              {att.name}
                            </button>
                            <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                              {formatAttachmentSize(att.size)}
                            </span>
                            {!isEditingTaskDetails && (
                              <button
                                type="button"
                                onClick={() => void handleDownloadAttachment(att)}
                                className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                                title="Download"
                              >
                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {isEditingTaskDetails && (
                              <button
                                type="button"
                                onClick={() => setTempAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
                                title="Remove attachment"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {isEditingTaskDetails && tempAttachments.length === 0 && (
                    <button
                      type="button"
                      onClick={() => detailAttachInputRef.current?.click()}
                      disabled={attachmentsUploading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 py-3 text-[11px] font-semibold text-zinc-400 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-500 dark:border-white/[0.06] dark:hover:bg-indigo-950/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PaperClipIcon className="h-4 w-4" />
                      {attachmentsUploading ? "Uploading…" : "Click to attach files"}
                    </button>
                  )}
                </div>
                </>
                ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Task notes
                      {taskNotes.length > 0 && (
                        <span className="ml-1.5 font-semibold text-zinc-500 dark:text-zinc-400">
                          ({taskNotes.length})
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => openNotesModal()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--app-primary)] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-[var(--app-primary-hover)] transition-colors"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Add note
                    </button>
                  </div>

                  {taskNotesLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                    </div>
                  ) : taskNotes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/40 px-4 py-10 text-center dark:border-white/10 dark:bg-zinc-900/30">
                      <DocumentTextIcon className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                      <p className="mt-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400">No notes yet</p>
                      <p className="mt-1 text-[11px] text-zinc-450 dark:text-zinc-500">
                        Add updates, blockers, or links — each note shows who wrote it and when.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {taskNotes.map((note) => {
                        const initials = note.authorName
                          .split(/\s+/)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);
                        const edited = noteWasEdited(note);
                        return (
                          <article
                            key={note.id}
                            className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/80"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-2.5">
                                <span
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm"
                                  style={{ backgroundColor: getNoteAuthorHsl(note.authorName) }}
                                >
                                  {initials}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                                    {note.authorName}
                                  </p>
                                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500">
                                    {formatNoteTimestamp(note.createdAt)}
                                    {edited && (
                                      <span className="ml-1 text-zinc-400 dark:text-zinc-500">· edited</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => openNotesModal(note)}
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                                  title="Edit note"
                                >
                                  <PencilIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNoteToDelete(note)}
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
                                  title="Delete note"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                              {note.content}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500">
                    Notes are saved with the task and visible to anyone with access to this workspace.
                  </p>
                </div>
                )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-200/60 px-6 py-4 dark:border-white/[0.06] bg-white dark:bg-zinc-900">
                {isEditingTaskDetails ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelTaskEdits}
                      className="rounded-xl border border-zinc-205 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-700/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTaskEdits}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98 transition-all"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700/80"
                  >
                    Close panel
                  </button>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task notes modal */}
      <AnimatePresence>
        {showNotesModal && selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !notesSaving && setShowNotesModal(false)}
              className="fixed inset-0 z-[300] bg-zinc-950/30 backdrop-blur-sm dark:bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="fixed inset-0 z-[310] m-auto flex h-fit w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-[var(--app-primary)]" />
                  <div className="min-w-0">
                    <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {editingNoteId ? "Edit note" : "Add note"}
                    </h3>
                    <p
                      className="max-w-[280px] truncate text-[10px] text-zinc-500 dark:text-zinc-400"
                      title={selectedTask.title}
                    >
                      {selectedTask.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={notesSaving}
                  onClick={() => setShowNotesModal(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 disabled:opacity-50"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <textarea
                autoFocus
                rows={12}
                value={notesModalDraft}
                onChange={(e) => setNotesModalDraft(e.target.value)}
                placeholder="Meeting takeaways, blockers, links, reminders…"
                disabled={notesSaving}
                className="mt-4 w-full min-h-[240px] resize-y rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm leading-relaxed text-zinc-800 outline-none focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary-soft)] dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 disabled:opacity-60"
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={notesSaving}
                  onClick={() => setShowNotesModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={notesSaving}
                  onClick={handleSaveNotesModal}
                  className="rounded-xl bg-[var(--app-primary)] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                >
                  {notesSaving ? "Saving…" : editingNoteId ? "Update note" : "Add note"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete note confirmation */}
      <AnimatePresence>
        {noteToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteToDelete(null)}
              className="fixed inset-0 z-[300] bg-zinc-950/30 backdrop-blur-sm dark:bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 z-[310] m-auto flex h-fit max-w-sm flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                Delete note?
              </h3>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                This note by {noteToDelete.authorName} will be permanently removed.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNoteToDelete(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(noteToDelete)}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modern AddTaskModal component integrated */}
      <AddTaskModal
        key={`add-${addModalSession}`}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleAddTaskFromModal}
        assignees={assigneesList}
        defaultStatus={addModalDefaultStatus as import("@/types/task").TaskStatus | null}
      />

      <AddTaskModal
        key={`edit-${editModalSession}`}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditModalTask(null);
        }}
        taskToEdit={editModalTask}
        onUpdate={handleUpdateTaskFromModal}
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
                    {[{ id: "All", label: "All" }, ...TASK_PRIORITY_OPTIONS.map((o) => ({ id: o.value, label: o.label }))].map((p) => {
                      const isSelected = filterPriority === p.id || (p.id === "All" && filterPriority === "All");
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFilterPriority(p.id === "All" ? "All" : p.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                            isSelected
                              ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                              : "border-zinc-200 bg-zinc-50 text-zinc-650 hover:bg-zinc-100 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {p.label}
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

      {/* TASK STATUS CHANGE MODAL */}
      <AnimatePresence>
        {pendingStatusChange && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelStatusChange}
              className="fixed inset-0 z-[200] bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed left-1/2 top-1/2 z-[210] w-[calc(100%-2rem)] max-w-[440px] min-w-0 -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] flex"
            >
              <div className="flex w-full min-w-0 flex-col">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm ${
                      pendingStatusChange.newStatus === "done"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
                    }`}
                  >
                    {pendingStatusChange.newStatus === "done" ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <ArrowPathIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {pendingStatusChange.newStatus === "done"
                        ? "Mark task as complete?"
                        : `Move to ${statusLabelMap[pendingStatusChange.newStatus] || pendingStatusChange.newStatus}?`}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      <span
                        className="font-semibold text-zinc-700 dark:text-zinc-300"
                        title={pendingStatusChange.task.title}
                      >
                        {truncateWithEllipsis(pendingStatusChange.task.title, DIALOG_TITLE_MAX_CHARS)}
                      </span>
                      {" "}will move from{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {statusLabelMap[pendingStatusChange.previousStatus] || pendingStatusChange.previousStatus}
                      </span>
                      {" "}to{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {statusLabelMap[pendingStatusChange.newStatus] || pendingStatusChange.newStatus}
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="status-change-note"
                    className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400"
                  >
                    Add a note <span className="font-normal text-zinc-400">(optional)</span>
                  </label>
                  <textarea
                    id="status-change-note"
                    rows={3}
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder="Want to mention anything about this change?"
                    className="mt-1.5 block w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-[var(--app-primary)] focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelStatusChange}
                  disabled={statusChangeSaving}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmStatusChange()}
                  disabled={statusChangeSaving}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition-all disabled:opacity-60 ${
                    pendingStatusChange.newStatus === "done"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-[var(--app-primary)] hover:bg-[var(--app-primary-hover)]"
                  }`}
                >
                  {statusChangeSaving
                    ? "Saving…"
                    : pendingStatusChange.newStatus === "done"
                      ? "Yes, mark complete"
                      : "Update status"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE TASK CONFIRMATION MODAL */}
      <AnimatePresence>
        {taskToDelete && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskToDelete(null)}
              className="fixed inset-0 z-[200] bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed left-1/2 top-1/2 z-[210] w-[calc(100%-2rem)] max-w-[400px] min-w-0 -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] flex"
            >
              <div className="flex w-full min-w-0 flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400 mb-4 shadow-sm">
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Delete Task
                </h3>
                <p className="mt-2 w-full min-w-0 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to delete{" "}
                  <span
                    className="inline-block max-w-full truncate align-bottom font-semibold text-zinc-700 dark:text-zinc-300"
                    title={taskToDelete.title}
                  >
                    &quot;{truncateWithEllipsis(taskToDelete.title, DIALOG_TITLE_MAX_CHARS)}&quot;
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-655 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = taskToDelete.id;
                    setTaskToDelete(null);
                    await handleTaskDelete(id);
                  }}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
