"use client";

import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ClockIcon,
  CheckIcon,
  Squares2X2Icon,
  FolderIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  PaperClipIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState, useMemo } from "react";

import type { NewTaskPayload, Task, TaskPriority, TaskStatus } from "@/types/task";
import { useWorkspaceDefaultsStore } from "@/store/workspaceDefaultsStore";
import posthog from "@/lib/posthog-noop";

/* ─── constants ──────────────────────────────────────────── */

const CATEGORIES = [
  "General",
  "Product",
  "Engineering",
  "Design",
  "Operations",
  "Marketing",
] as const;

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  key: string;
  color: string;
  ring: string;
  dot: string;
}[] = [
  {
    key: "urgent",
    value: "high",
    label: "Urgent",
    color:
      "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/40",
    ring: "ring-rose-400/40",
    dot: "bg-rose-500",
  },
  {
    key: "high",
    value: "high",
    label: "High",
    color:
      "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/40",
    ring: "ring-orange-400/40",
    dot: "bg-orange-400",
  },
  {
    key: "normal",
    value: "medium",
    label: "Normal",
    color:
      "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40",
    ring: "ring-amber-400/40",
    dot: "bg-amber-500",
  },
  {
    key: "low",
    value: "low",
    label: "Low",
    color:
      "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/40",
    ring: "ring-emerald-400/40",
    dot: "bg-emerald-500",
  },
];

const STATUS_OPTIONS: {
  value: TaskStatus;
  label: string;
  dot: string;
  color: string;
}[] = [
  {
    value: "todo",
    label: "To Do",
    dot: "bg-zinc-400",
    color: "text-zinc-600 dark:text-zinc-300",
  },
  {
    value: "in_progress",
    label: "In Progress",
    dot: "bg-teal-500",
    color: "text-teal-700 dark:text-teal-300",
  },
  {
    value: "blocked",
    label: "Blocked",
    dot: "bg-rose-500",
    color: "text-rose-700 dark:text-rose-300",
  },
  {
    value: "overdue",
    label: "Overdue",
    dot: "bg-red-600",
    color: "text-red-700 dark:text-red-300",
  },
  {
    value: "on_hold",
    label: "On Hold",
    dot: "bg-amber-500",
    color: "text-amber-700 dark:text-amber-300",
  },
  {
    value: "done",
    label: "Done",
    dot: "bg-emerald-500",
    color: "text-emerald-700 dark:text-emerald-300",
  },
];

const LABEL_OPTIONS = [
  "Bug",
  "Feature",
  "Improvement",
  "Docs",
  "Design",
  "Meeting",
] as const;


/* ─── tiny styled dropdown ───────────────────────────────── */

type DropdownOption = {
  value: string;
  label: string;
  dot?: string;
  icon?: React.ReactNode;
};

function StyledDropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none transition-all hover:border-zinc-300 hover:bg-zinc-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2 truncate">
          {selected?.dot && (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${selected.dot}`}
            />
          )}
          {selected?.icon && (
            <span className="shrink-0 text-zinc-400">{selected.icon}</span>
          )}
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.11 }}
            className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl scrollbar-thin dark:border-white/10 dark:bg-zinc-900"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {opt.dot && (
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${opt.dot}`}
                      />
                    )}
                    {opt.icon && (
                      <span className="shrink-0 text-zinc-400">{opt.icon}</span>
                    )}
                    {opt.label}
                  </div>
                  {isSelected && (
                    <CheckIcon className="h-3.5 w-3.5 shrink-0 stroke-[2.5] text-indigo-500" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StyledMultiDropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: DropdownOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = (optValue: string) => {
    if (optValue === "Unassigned") {
      onChange([]);
      return;
    }
    const newValue = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value.filter((v) => v !== "Unassigned"), optValue];
    onChange(newValue);
  };

  const displayLabel =
    value.length === 0
      ? "Unassigned"
      : value.length === 1
      ? value[0]
      : `${value.length} assignees`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none transition-all hover:border-zinc-300 hover:bg-zinc-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2 truncate">
          <UserIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.11 }}
            className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl scrollbar-thin dark:border-white/10 dark:bg-zinc-900"
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
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.dot && (
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${opt.dot}`}
                      />
                    )}
                    {opt.icon && (
                      <span className="shrink-0 text-zinc-450">{opt.icon}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && (
                    <CheckIcon className="h-3.5 w-3.5 shrink-0 stroke-[2.5] text-indigo-500" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function parseDueFromLabel(dueLabel: string): { mode: "none" | "date"; date: string } {
  if (!dueLabel || dueLabel === "No date") {
    return { mode: "none", date: "" };
  }
  const parsed = new Date(dueLabel);
  if (!Number.isNaN(parsed.getTime())) {
    return { mode: "date", date: parsed.toISOString().slice(0, 10) };
  }
  return { mode: "none", date: "" };
}

function attachmentsFromUrls(urls?: string[]): { name: string; size: number; dataUrl: string }[] {
  return (urls ?? []).map((dataUrl, index) => ({
    name: `attachment-${index + 1}`,
    size: 0,
    dataUrl,
  }));
}

/* ─── types ──────────────────────────────────────────────── */

type AddTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate?: (payload: NewTaskPayload) => void;
  onUpdate?: (taskId: string, payload: NewTaskPayload) => void;
  /** When set, modal opens in edit mode with fields pre-filled */
  taskToEdit?: Task | null;
  assignees?: string[];
  /** Pre-selected project id (e.g. when opened from a project drawer) */
  defaultProjectId?: string | null;
  /** Pre-selected status */
  defaultStatus?: TaskStatus | null;
  /** Pre-selected assignee */
  defaultAssignee?: string | null;
  defaultAssignees?: string[];
};

/* ─── main component ─────────────────────────────────────── */

export function AddTaskModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  taskToEdit,
  assignees,
  defaultProjectId,
  defaultStatus: defaultStatusProp,
  defaultAssignee,
  defaultAssignees,
}: AddTaskModalProps) {
  const titleId = useId();
  const isEditMode = Boolean(taskToEdit?.id);

  const {
    priority: defaultPriority,
    status: defaultStatus,
    category: defaultCategory,
    labels: defaultLabels,
    customCategories,
    customLabels,
    kanbanColumnOrder,
    fetchDefaults,
  } = useWorkspaceDefaultsStore();

  // fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [priorityKey, setPriorityKey] = useState<string>("normal");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueMode, setDueMode] = useState<"none" | "date">("none");
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    defaultAssignees ?? (defaultAssignee ? [defaultAssignee] : [])
  );
  const [designation, setDesignation] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [attachments, setAttachments] = useState<{ name: string; size: number; dataUrl: string }[]>([]);
  const attachInputRef = useRef<HTMLInputElement>(null);

  // project
  const [projectId, setProjectId] = useState<string>(
    defaultProjectId ?? "__none__"
  );
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Fetch defaults and projects when modal opens
  useEffect(() => {
    if (!open) return;
    
    const wid = typeof window !== "undefined"
      ? parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10)
      : 1;

    fetchDefaults(wid);

    setProjectsLoading(true);
    fetch(`/api/project?wid=${wid}&email=`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.projects)) {
          setProjects(
            json.projects.map((p: any) => ({ id: p.id, name: p.name }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setProjectsLoading(false));
  }, [open, fetchDefaults]);

  // Sync form on open — edit task or create defaults
  useEffect(() => {
    if (!open) return;

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setCategory(taskToEdit.category || "General");
      const pKey =
        PRIORITY_OPTIONS.find((p) => p.value === taskToEdit.priority)?.key || "normal";
      setPriorityKey(pKey);
      setStatus(
        (taskToEdit.status as TaskStatus) ||
          (taskToEdit.done ? "done" : "todo")
      );
      setLabels(taskToEdit.labels || []);
      setSelectedAssignees(
        taskToEdit.assignees?.length
          ? taskToEdit.assignees
          : taskToEdit.assignee
            ? [taskToEdit.assignee]
            : []
      );
      const due = parseDueFromLabel(taskToEdit.due);
      setDueMode(due.mode);
      setDueDate(due.date);
      setAttachments(attachmentsFromUrls(taskToEdit.attachmentUrls));
      setProjectId(taskToEdit.projectId ?? "__none__");
      setDesignation("");
      setRole("");
      return;
    }

    setProjectId(defaultProjectId ?? "__none__");
    setCategory(defaultCategory || "General");
    const pKey = PRIORITY_OPTIONS.find((p) => p.value === defaultPriority)?.key || "normal";
    setPriorityKey(pKey);
    setStatus(defaultStatusProp || (defaultStatus as TaskStatus) || "todo");
    setLabels(defaultLabels || []);
    setSelectedAssignees(defaultAssignees ?? (defaultAssignee ? [defaultAssignee] : []));
  }, [
    open,
    taskToEdit,
    defaultPriority,
    defaultStatus,
    defaultCategory,
    defaultLabels,
    defaultStatusProp,
    defaultAssignee,
    defaultAssignees,
    defaultProjectId,
  ]);

  // Sync defaultProjectId when it changes
  useEffect(() => {
    setProjectId(defaultProjectId ?? "__none__");
  }, [defaultProjectId]);

  // keyboard / scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function toggleLabel(label: string) {
    setLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  function computedDueLabel(): string {
    if (dueMode === "none" || !dueDate) return "No date";
    try {
      const d = new Date(`${dueDate}T12:00:00`);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "No date";
    }
  }

  function submit() {
    const t = title.trim();
    if (!t) return;
    const payload: NewTaskPayload = {
      title: t,
      description: description.trim(),
      category,
      priority: PRIORITY_OPTIONS.find((p) => p.key === priorityKey)?.value ?? "medium",
      status,
      dueLabel: computedDueLabel(),
      labels,
      assignees: selectedAssignees,
      designation,
      role,
      projectId: projectId === "__none__" ? null : projectId,
      attachmentUrls: attachments.map((a) => a.dataUrl),
    };

    if (isEditMode && taskToEdit?.id && onUpdate) {
      posthog.capture("task_updated", {
        task_id: taskToEdit.id,
        priority: payload.priority,
        status: payload.status,
        category: payload.category,
        has_due_date: payload.dueLabel !== "No date",
        assignee_count: payload.assignees?.length ?? 0,
        has_project: Boolean(payload.projectId),
        label_count: payload.labels?.length ?? 0,
      });
      onUpdate(taskToEdit.id, payload);
      onClose();
      return;
    }

    if (!onCreate) return;
    posthog.capture("task_created", {
      priority: payload.priority,
      status: payload.status,
      category: payload.category,
      has_due_date: payload.dueLabel !== "No date",
      assignee_count: payload.assignees?.length ?? 0,
      has_project: Boolean(payload.projectId),
      label_count: payload.labels?.length ?? 0,
      has_description: Boolean(payload.description),
      attachment_count: payload.attachmentUrls?.length ?? 0,
    });
    onCreate(payload);
    // reset to defaults
    setTitle("");
    setDescription("");
    setCategory(defaultCategory || "General");
    const pKey = PRIORITY_OPTIONS.find((p) => p.value === defaultPriority)?.key || "normal";
    setPriorityKey(pKey);
    setStatus(defaultStatusProp || (defaultStatus as TaskStatus) || "todo");
    setDueMode("none");
    setDueDate("");
    setLabels(defaultLabels || []);
    setSelectedAssignees(defaultAssignees ?? (defaultAssignee ? [defaultAssignee] : []));
    setProjectId(defaultProjectId ?? "__none__");
    setAttachments([]);
    onClose();
  }

  const dynamicStatusOptions = useMemo(() => {
    const order = kanbanColumnOrder && kanbanColumnOrder.length > 0
      ? kanbanColumnOrder
      : ["todo", "in_progress", "blocked", "overdue", "done"];
    return order.map((id, index) => {
      if (id === "todo") return { value: "todo", label: "To Do", dot: "bg-zinc-400" };
      if (id === "in_progress") return { value: "in_progress", label: "In Progress", dot: "bg-teal-500" };
      if (id === "on_hold") return { value: "on_hold", label: "On Hold", dot: "bg-amber-500" };
      if (id === "blocked") return { value: "blocked", label: "Blocked", dot: "bg-rose-500" };
      if (id === "overdue") return { value: "overdue", label: "Overdue", dot: "bg-red-600" };
      if (id === "done") return { value: "done", label: "Done", dot: "bg-emerald-500" };

      const label = id.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const colors = ["bg-indigo-500", "bg-purple-500", "bg-amber-500", "bg-fuchsia-500", "bg-cyan-500"];
      return { value: id, label, dot: colors[index % colors.length] };
    });
  }, [kanbanColumnOrder]);

  /* build dropdown option arrays */
  const statusOptions: DropdownOption[] = dynamicStatusOptions.map((s) => ({
    value: s.value,
    label: s.label,
    dot: s.dot,
  }));

  const assigneeOptions: DropdownOption[] = (
    assignees ?? ["Unassigned"]
  ).map((a) => ({
    value: a,
    label: a,
    icon:
      a === "Unassigned" ? (
        <UserIcon className="h-3.5 w-3.5" />
      ) : (
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-black text-white"
          style={{
            backgroundColor: `hsl(${[...a].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0) % 360}, 55%, 42%)`,
          }}
        >
          {a
            .trim()
            .split(/\s+/)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </span>
      ),
  }));

  const categoryOptions: DropdownOption[] = (customCategories || []).map((c) => ({
    value: c,
    label: c,
    icon: <FolderIcon className="h-3.5 w-3.5" />,
  }));

  const projectOptions: DropdownOption[] = [
    {
      value: "__none__",
      label: "No project",
      icon: <FolderIcon className="h-3.5 w-3.5 text-zinc-300" />,
    },
    ...projects.map((p) => ({
      value: p.id,
      label: p.name,
      icon: (
        <span className="flex h-4 w-4 items-center justify-center rounded bg-indigo-100 dark:bg-indigo-950/40">
          <FolderIcon className="h-2.5 w-2.5 text-indigo-500" />
        </span>
      ),
    })),
  ];

  const currentStatus = dynamicStatusOptions.find((s) => s.value === status);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm dark:bg-black/70"
            aria-label="Close dialog"
            onClick={onClose}
          />

          {/* Modal Box */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-[min(92vh,640px)] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_30px_60px_-10px_rgba(0,0,0,0.28)] dark:border-white/[0.07] dark:bg-zinc-900 dark:shadow-black/60"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-white/[0.05] bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--app-primary)] shadow-sm">
                  <Squares2X2Icon className="h-3.5 w-3.5 text-[var(--app-primary-foreground)]" />
                </div>
                <div>
                  <h2
                    id={titleId}
                    className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
                  >
                    {isEditMode ? "Edit Task" : "Create New Task"}
                  </h2>
                  <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    {isEditMode
                      ? "Update task details below"
                      : "Fill in the details below to add a task"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Close"
              >
                <XMarkIcon className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Body — split layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Title + Description + Labels */}
              <div className="flex flex-1 flex-col gap-5 overflow-y-auto border-r border-zinc-100 px-6 py-5 scrollbar-thin dark:border-white/[0.05]">
                {/* Title */}
                <div className="space-y-1.5">
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title…"
                    className="w-full border-b border-transparent bg-transparent py-1.5 text-lg font-bold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 transition-colors hover:border-zinc-100 focus:border-[var(--app-primary)] dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:hover:border-zinc-800 dark:focus:border-[var(--app-primary)]"
                  />
                  {!title.trim() && (
                    <p className="text-[10px] font-medium text-rose-400">
                      Title is required to submit.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-1 flex-col">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description…"
                    rows={7}
                    className="w-full flex-1 resize-none rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3.5 py-3 text-xs leading-relaxed text-zinc-800 outline-none transition-all focus:border-[var(--app-primary)] focus:bg-white focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.06] dark:bg-zinc-950/50 dark:text-zinc-200 dark:focus:border-[var(--app-primary)]"
                  />
                </div>

                {/* Labels */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                    <TagIcon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Labels
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(customLabels || []).map((l) => {
                      const active = labels.includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => toggleLabel(l)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            active
                              ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300"
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
                          }`}
                        >
                          {active && (
                            <span className="mr-1 text-indigo-400">✓</span>
                          )}
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                      <PaperClipIcon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Attachments</span>
                      {attachments.length > 0 && (
                        <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                          {attachments.length}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => attachInputRef.current?.click()}
                      className="flex items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/10 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-300 transition-all cursor-pointer"
                    >
                      <PaperClipIcon className="h-3 w-3" />
                      Add files
                    </button>
                    <input
                      ref={attachInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setAttachments((prev) => [
                              ...prev,
                              { name: file.name, size: file.size, dataUrl: ev.target?.result as string },
                            ]);
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* File chips */}
                  {attachments.length > 0 && (
                    <div className="space-y-1.5">
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-white/[0.06] dark:bg-zinc-900/60"
                        >
                          <PaperClipIcon className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                          <span className="flex-1 truncate text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{att.name}</span>
                          <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                            {att.size < 1024 * 1024
                              ? `${(att.size / 1024).toFixed(1)} KB`
                              : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop zone hint */}
                  {attachments.length === 0 && (
                    <button
                      type="button"
                      onClick={() => attachInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 py-3 text-[11px] font-semibold text-zinc-400 transition-all cursor-pointer hover:border-[var(--app-primary-soft-border)] hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] dark:border-white/[0.06] dark:hover:border-[var(--app-primary-soft-border)] dark:hover:bg-[var(--app-primary-soft)]"
                    >
                      <PaperClipIcon className="h-4 w-4" />
                      Click to attach files
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Attributes pane */}
              <div className="w-[270px] shrink-0 overflow-y-auto bg-zinc-50/40 px-5 py-5 scrollbar-thin dark:bg-zinc-900/20 space-y-5">

                {/* Project (optional) */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <FolderIcon className="h-3.5 w-3.5" />
                    Project
                    <span className="ml-auto text-[9px] font-medium text-zinc-300 dark:text-zinc-600 normal-case tracking-normal">
                      optional
                    </span>
                  </label>
                  {projectsLoading ? (
                    <div className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 dark:border-white/10 dark:bg-zinc-950">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                      <span className="text-[11px] text-zinc-400">Loading…</span>
                    </div>
                  ) : (
                    <StyledDropdown
                      value={projectId}
                      onChange={setProjectId}
                      options={projectOptions}
                      placeholder="No project"
                    />
                  )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <Squares2X2Icon className="h-3.5 w-3.5" />
                    Status
                  </label>
                  <StyledDropdown
                    value={status}
                    onChange={(v) => setStatus(v as TaskStatus)}
                    options={statusOptions}
                  />
                </div>

                {/* Priority — pill buttons */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <ExclamationCircleIcon className="h-3.5 w-3.5" />
                    Priority
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRIORITY_OPTIONS.map((p) => {
                      const sel = priorityKey === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPriorityKey(p.key)}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-[11px] font-semibold transition-all ${
                            sel
                              ? `${p.color} ring-2 ${p.ring}`
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-950/50 dark:text-zinc-400 dark:hover:border-zinc-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${p.dot}`}
                          />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <UserIcon className="h-3.5 w-3.5" />
                    Assignee
                  </label>
                  <StyledMultiDropdown
                    value={selectedAssignees}
                    onChange={setSelectedAssignees}
                    options={assigneeOptions}
                    placeholder="Unassigned"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <FolderIcon className="h-3.5 w-3.5" />
                    Category
                  </label>
                  <StyledDropdown
                    value={category}
                    onChange={setCategory}
                    options={categoryOptions}
                  />
                </div>



                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Due Date
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDueMode("none")}
                      className={`flex-1 rounded-xl border py-1.5 text-[11px] font-semibold transition-all ${
                        dueMode === "none"
                          ? "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          : "border-zinc-200 bg-white text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-950/50 dark:text-zinc-400"
                      }`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setDueMode("date")}
                      className={`flex-1 rounded-xl border py-1.5 text-[11px] font-semibold transition-all ${
                        dueMode === "date"
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300"
                          : "border-zinc-200 bg-white text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-950/50 dark:text-zinc-400"
                      }`}
                    >
                      Pick Date
                    </button>
                  </div>
                  {dueMode === "date" && (
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2 text-xs font-semibold text-zinc-700 outline-none focus:border-indigo-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4 dark:border-white/[0.05] bg-zinc-50/50 dark:bg-zinc-900/40">
              {/* project indicator */}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 truncate">
                <FolderIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {projectId === "__none__"
                    ? "No project"
                    : (projects.find((p) => p.id === projectId)?.name ?? "Project")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!title.trim()}
                  className="rounded-xl bg-[var(--app-primary)] px-5 py-2 text-xs font-bold text-[var(--app-primary-foreground)] shadow-md transition-all hover:bg-[var(--app-primary-hover)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isEditMode ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
