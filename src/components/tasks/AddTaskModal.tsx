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
  ExclamationCircleIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode } from "react";

import type { NewTaskPayload, TaskPriority, TaskStatus } from "@/types/task";

const CATEGORIES = [
  "General",
  "Product",
  "Engineering",
  "Design",
  "Operations",
  "Marketing",
] as const;

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; key: string; color: string; dot: string }[] = [
  { key: "urgent", value: "high", label: "Urgent", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-300", dot: "bg-rose-500" },
  { key: "high", value: "high", label: "High", color: "text-rose-500 bg-rose-50/50 dark:bg-rose-900/10 dark:text-rose-400", dot: "bg-rose-400" },
  { key: "normal", value: "medium", label: "Normal", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300", dot: "bg-amber-500" },
  { key: "low", value: "low", label: "Low", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-300", dot: "bg-emerald-500" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string; dot: string }[] = [
  { value: "todo", label: "To Do", dot: "bg-zinc-400" },
  { value: "in_progress", label: "In Progress", dot: "bg-teal-500" },
  { value: "blocked", label: "Blocked", dot: "bg-rose-500" },
  { value: "done", label: "Done", dot: "bg-emerald-500" },
];

const LABEL_OPTIONS = ["Bug", "Feature", "Improvement", "Docs", "Design", "Meeting"] as const;

const ASSIGNEE_OPTIONS = ["Unassigned", "Me", "Alex Rivera", "Jordan Lee", "Sam Chen"] as const;

const ESTIMATE_OPTIONS = ["—", "1", "2", "3", "5", "8"] as const;

function getAvatar(name: string) {
  if (!name || name === "Unassigned") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        <UserIcon className="h-2.5 w-2.5" />
      </div>
    );
  }
  const initials = name === "Me" ? "ME" : name.trim().split(/\s+/).map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const colorMap: Record<string, string> = {
    "ME": "bg-teal-600 text-teal-50",
    "AR": "bg-indigo-600 text-indigo-50",
    "JL": "bg-purple-600 text-purple-50",
    "SC": "bg-amber-600 text-amber-50",
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
      className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${colorClass || "shadow-sm"}`}
      style={style}
    >
      {initials}
    </div>
  );
}

type AddTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: NewTaskPayload) => void;
  assignees?: string[];
};

export function AddTaskModal({ open, onClose, onCreate, assignees }: AddTaskModalProps) {
  const titleId = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [priorityKey, setPriorityKey] = useState<string>("normal");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueMode, setDueMode] = useState<"none" | "date">("none");
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [assignee, setAssignee] = useState<string>("Unassigned");
  const [estimate, setEstimate] = useState<string>("—");

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
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  function dueLabel(): string {
    if (dueMode === "none" || !dueDate) return "No date";
    try {
      const d = new Date(`${dueDate}T12:00:00`);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "No date";
    }
  }

  function submit() {
    const t = title.trim();
    if (!t) return;
    onCreate({
      title: t,
      description: description.trim(),
      category,
      priority: PRIORITY_OPTIONS.find((p) => p.key === priorityKey)?.value ?? "medium",
      status,
      dueLabel: dueLabel(),
      labels,
      assignee,
      estimate: estimate === "—" ? undefined : estimate,
    });
    // Reset values on successful submit
    setTitle("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setPriorityKey("normal");
    setStatus("todo");
    setDueMode("none");
    setDueDate("");
    setLabels([]);
    setAssignee("Unassigned");
    setEstimate("—");
    onClose();
  }

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
          {/* Backdrop overlay */}
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/45 dark:bg-black/65 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={onClose}
          />

          {/* Modal Box */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.2, 1] }}
            className="relative z-10 flex h-[min(90vh,620px)] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_24px_50px_-12px_rgba(0,0,0,0.22)] dark:border-white/[0.08] dark:bg-zinc-900 dark:shadow-black/50"
          >
            
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4.5 dark:border-white/[0.04] bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)] dark:bg-teal-950/45 dark:text-teal-200">
                  <FolderIcon className="h-3 w-3" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Task Workspace
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <h2 id={titleId} className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Create New Issue
                </h2>
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

            {/* Split Content Body */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Left Pane (Title & Description & Labels) - 62% */}
              <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5.5 space-y-5 scrollbar-thin border-r border-zinc-100 dark:border-white/[0.04]">
                
                {/* Title input */}
                <div className="space-y-1">
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Issue title"
                    className="w-full text-lg font-bold tracking-tight text-zinc-900 placeholder:text-zinc-300 bg-transparent border-b border-transparent hover:border-zinc-100 focus:border-[var(--app-primary)] py-1.5 outline-none transition-colors dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:hover:border-zinc-800 dark:focus:border-teal-500"
                  />
                  {!title.trim() && (
                    <p className="text-[10px] font-medium text-rose-500/80">Issue title is required to submit.</p>
                  )}
                </div>

                {/* Description */}
                <div className="flex-1 flex flex-col space-y-1.5">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add description..."
                    rows={8}
                    className="w-full flex-1 resize-none rounded-xl border border-zinc-200/80 bg-[#fbfbfa]/70 px-3.5 py-3 text-xs leading-relaxed text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.06] dark:bg-zinc-950/45 dark:text-zinc-200 dark:focus:border-zinc-700"
                  />
                </div>

                {/* Labels Selector */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                    <TagIcon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Labels</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LABEL_OPTIONS.map((l) => {
                      const active = labels.includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => toggleLabel(l)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            active
                              ? "bg-teal-50 border-teal-200/80 text-[var(--app-primary)] dark:bg-teal-950/30 dark:border-teal-900/40 dark:text-teal-300"
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700"
                          }`}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Pane (Sidebar Attributes) - 38% */}
              <div className="w-[280px] shrink-0 overflow-y-auto px-5 py-5.5 space-y-5 bg-stone-50/40 dark:bg-zinc-900/30 scrollbar-thin">
                
                {/* 1. Attribute: Status */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <Squares2X2Icon className="h-3.5 w-3.5" />
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full text-xs font-bold text-zinc-700 bg-white border border-zinc-200 p-2 rounded-xl outline-none cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200 shadow-sm transition-colors hover:border-zinc-300"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Attribute: Priority */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <ExclamationCircleIcon className="h-3.5 w-3.5" />
                    Priority
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRIORITY_OPTIONS.map((p) => {
                      const selected = priorityKey === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPriorityKey(p.key)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-semibold transition-all ${
                            selected
                              ? `${p.color} border-current ring-1 ring-current`
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-950/50 dark:text-zinc-400 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Attribute: Assignee */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <UserIcon className="h-3.5 w-3.5" />
                    Assignee
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 p-2 rounded-xl outline-none cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200 shadow-sm hover:border-zinc-300"
                  >
                    {(assignees || ASSIGNEE_OPTIONS).map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Attribute: Category */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <FolderIcon className="h-3.5 w-3.5" />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-medium text-zinc-700 bg-white border border-zinc-200 p-2 rounded-xl outline-none cursor-pointer dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200 shadow-sm hover:border-zinc-300"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Attribute: Estimate Points */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <ClockIcon className="h-3.5 w-3.5" />
                    Story Points
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {ESTIMATE_OPTIONS.map((est) => {
                      const active = estimate === est;
                      return (
                        <button
                          key={est}
                          type="button"
                          onClick={() => setEstimate(est)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                            active
                              ? "bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-950/30 dark:border-teal-900/40 dark:text-teal-300"
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-950/50 dark:text-zinc-400 dark:hover:border-zinc-700"
                          }`}
                        >
                          {est}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Attribute: Due Date */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Due Date
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDueMode("none")}
                      className={`flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition-all ${
                        dueMode === "none"
                          ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/30 dark:border-teal-900/40 dark:text-teal-300"
                          : "border-zinc-200 bg-white text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-950/50"
                      }`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setDueMode("date")}
                      className={`flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition-all ${
                        dueMode === "date"
                          ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/30 dark:border-teal-900/40 dark:text-teal-300"
                          : "border-zinc-200 bg-white text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-950/50"
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
                      className="w-full text-xs font-semibold bg-white border border-zinc-200 p-2 rounded-xl outline-none focus:border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200 shadow-sm"
                    />
                  )}
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-100 px-6 py-4 dark:border-white/[0.04] bg-stone-50/50 dark:bg-zinc-900/40">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4.5 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!title.trim()}
                className="rounded-xl bg-[var(--app-primary)] px-5 py-2 text-xs font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)_inset] transition-all hover:bg-[var(--app-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Create task
              </button>
            </div>

          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
