import type { TaskPriority } from "@/types/task";

export type PriorityOption = {
  value: TaskPriority;
  label: string;
  dot: string;
};

/** Canonical priority options — keep Add Task, table, kanban, and filters in sync. */
export const TASK_PRIORITY_OPTIONS: PriorityOption[] = [
  { value: "urgent", label: "Urgent", dot: "bg-rose-500" },
  { value: "high", label: "High", dot: "bg-orange-400" },
  { value: "medium", label: "Normal", dot: "bg-amber-500" },
  { value: "low", label: "Low", dot: "bg-emerald-500" },
];

export function priorityLabel(priority: TaskPriority | string): string {
  return (
    TASK_PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ??
    "Normal"
  );
}

export function priorityDot(priority: TaskPriority | string): string {
  return (
    TASK_PRIORITY_OPTIONS.find((o) => o.value === priority)?.dot ??
    "bg-amber-500"
  );
}

export function normalizeTaskPriority(value: unknown): TaskPriority {
  const v = String(value ?? "medium").trim().toLowerCase();
  if (v === "urgent") return "urgent";
  if (v === "high") return "high";
  if (v === "low") return "low";
  if (v === "medium" || v === "normal") return "medium";
  return "medium";
}
