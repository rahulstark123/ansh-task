"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowTrendingUpIcon,
  Bars3Icon,
  BellAlertIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  FireIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

const STORAGE_KEY = "ansh-task-dashboard-widgets-v1";

const DEFAULT_WIDGET_ORDER = [
  "todays-tasks",
  "pending-approvals",
  "team-productivity",
  "ai-insights",
  "upcoming-meetings",
  "priority-work",
  "project-progress",
  "attendance",
  "notifications",
] as const;

type WidgetId = (typeof DEFAULT_WIDGET_ORDER)[number];

const WIDGET_META: Record<
  WidgetId,
  { title: string; subtitle: string; icon: typeof ChartBarIcon }
> = {
  "todays-tasks": {
    title: "Today's tasks",
    subtitle: "What you said you'd finish today",
    icon: CheckCircleIcon,
  },
  "pending-approvals": {
    title: "Pending approvals",
    subtitle: "Waiting on a yes from you or someone else",
    icon: ShieldCheckIcon,
  },
  "team-productivity": {
    title: "Team productivity",
    subtitle: "Rough throughput vs last week",
    icon: ChartBarIcon,
  },
  "ai-insights": {
    title: "AI insights",
    subtitle: "Patterns the model noticed (take with salt)",
    icon: CpuChipIcon,
  },
  "upcoming-meetings": {
    title: "Upcoming meetings",
    subtitle: "The next few blocks on the calendar",
    icon: CalendarDaysIcon,
  },
  "priority-work": {
    title: "Priority work",
    subtitle: "Things that will hurt if they slip",
    icon: BoltIcon,
  },
  "project-progress": {
    title: "Project progress",
    subtitle: "Where active projects sit right now",
    icon: ArrowTrendingUpIcon,
  },
  attendance: {
    title: "Attendance snapshot",
    subtitle: "In office, remote, out — rough picture",
    icon: UserGroupIcon,
  },
  notifications: {
    title: "Notifications",
    subtitle: "Mentions and nudges worth skimming",
    icon: BellAlertIcon,
  },
};

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-16 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md bg-[var(--app-primary)]/80 dark:bg-teal-400/70"
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function ProductivityRing({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full p-[3px]"
        style={{
          background: `conic-gradient(var(--app-primary) ${score * 3.6}deg, rgba(148,163,184,0.35) 0deg)`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center dark:bg-zinc-900">
          <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{score}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">score</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Productivity</p>
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Strong week</p>
        <p className="mt-1 text-xs text-zinc-500">+6 pts vs 7-day avg</p>
      </div>
    </div>
  );
}

function WidgetBody({ id }: { id: WidgetId }) {
  switch (id) {
    case "todays-tasks":
      return (
        <div className="space-y-3">
          {[
            { t: "Ship dashboard widgets", d: "Today · 2h" },
            { t: "Review project milestones", d: "Today · EOD" },
            { t: "Brain board sync notes", d: "Tomorrow" },
          ].map((row) => (
            <div
              key={row.t}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-white/5 dark:bg-zinc-950/40"
            >
              <p className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-100">{row.t}</p>
              <span className="shrink-0 text-[10px] font-semibold text-zinc-400">{row.d}</span>
            </div>
          ))}
          <Link
            href="/tasks"
            className="inline-flex text-xs font-bold text-[var(--app-primary)] hover:text-[var(--app-primary-hover)]"
          >
            Open task list →
          </Link>
        </div>
      );
    case "pending-approvals":
      return (
        <ul className="space-y-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          <li className="flex justify-between rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
            <span>Budget · Design sprint</span>
            <span className="text-amber-700 dark:text-amber-300">Due Fri</span>
          </li>
          <li className="flex justify-between rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/50">
            <span>HR · Contractor add</span>
            <span className="text-zinc-400">2d</span>
          </li>
        </ul>
      );
    case "ai-insights":
      return (
        <div className="space-y-2 rounded-2xl border border-dashed border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)]/40 p-3 dark:border-teal-500/20 dark:bg-teal-950/20">
          <p className="text-xs font-bold text-[var(--app-primary-soft-text)] dark:text-teal-100">
            “Three P1s share the same dependency — consider a single unblock slot.”
          </p>
          <button
            type="button"
            className="text-[10px] font-black uppercase tracking-widest text-[var(--app-primary)]"
          >
            Ask AI to plan day
          </button>
        </div>
      );
    case "upcoming-meetings":
      return (
        <ul className="space-y-2">
          {[
            { t: "Leadership stand-up", when: "09:00" },
            { t: "Brain board jam", when: "14:30" },
          ].map((m) => (
            <li
              key={m.t}
              className="flex items-center gap-2 rounded-xl border border-zinc-100 px-3 py-2 text-xs font-bold dark:border-white/5"
            >
              <ClockIcon className="h-4 w-4 text-[var(--app-primary)]" />
              <span className="flex-1 truncate text-zinc-800 dark:text-zinc-100">{m.t}</span>
              <span className="text-zinc-400">{m.when}</span>
            </li>
          ))}
        </ul>
      );
    case "priority-work":
      return (
        <div className="flex flex-wrap gap-2">
          {["P1 · API cutover", "Blocked · Vendor", "Due 48h · QA"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-rose-200/80 bg-rose-50 px-3 py-1 text-[10px] font-bold text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100"
            >
              {tag}
            </span>
          ))}
        </div>
      );
    case "project-progress":
      return (
        <div className="space-y-3">
          {[
            { n: "ANSH Task v1", p: 72 },
            { n: "Client rollout", p: 44 },
          ].map((row) => (
            <div key={row.n}>
              <div className="mb-1 flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-200">
                <span>{row.n}</span>
                <span>{row.p}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[var(--app-primary)]"
                  style={{ width: `${row.p}%` }}
                />
              </div>
            </div>
          ))}
          <Link
            href="/projects"
            className="inline-flex text-xs font-bold text-[var(--app-primary)] hover:text-[var(--app-primary-hover)]"
          >
            View projects →
          </Link>
        </div>
      );
    case "attendance":
      return (
        <div className="flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {["A", "M", "S", "J"].map((x) => (
              <div
                key={x}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-xs font-bold text-zinc-700 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
              >
                {x}
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">94%</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">In office</p>
          </div>
        </div>
      );
    case "notifications":
      return (
        <ul className="space-y-2">
          {[
            { t: "@you in #product — roadmap", u: "2m" },
            { t: "Approval needed · invoices", u: "1h" },
            { t: "New doc shared — Q3 plan", u: "3h" },
          ].map((n) => (
            <li
              key={n.t}
              className="flex gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-950/50"
            >
              <ChatBubbleBottomCenterTextIcon className="h-4 w-4 shrink-0 text-[var(--app-primary)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-800 dark:text-zinc-100">{n.t}</p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-zinc-400">{n.u}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

function SortableWidgetCard({ id, index }: { id: WidgetId; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = WIDGET_META[id];
  const Icon = meta.icon;
  const wide = id === "team-productivity" || id === "project-progress";
  const radiusClass = wide
    ? "rounded-[1.25rem]"
    : index % 3 === 0
      ? "rounded-2xl"
      : index % 3 === 1
        ? "rounded-xl"
        : "rounded-[1.1rem]";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        wide ? "md:col-span-2" : "",
        isDragging ? "z-20 opacity-90" : "",
      ].join(" ")}
    >
      <div
        className={`app-hover-lift flex h-full min-h-[200px] flex-col border border-zinc-200/75 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(24,24,27,0.12)] dark:border-white/[0.07] dark:bg-zinc-900/45 dark:shadow-none ${radiusClass}`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-zinc-100/90 px-4 py-3 dark:border-white/[0.05]">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="cursor-grab rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-zinc-400 hover:border-[var(--app-primary-soft-border)] hover:text-[var(--app-primary)] active:cursor-grabbing dark:border-white/10 dark:bg-zinc-800"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-[var(--app-primary)]" />
                <h3 className="truncate font-heading text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {meta.title}
                </h3>
              </div>
              <p className="mt-0.5 text-[12px] font-normal leading-snug text-zinc-500 dark:text-zinc-400">
                {meta.subtitle}
              </p>
            </div>
          </div>
          {id === "team-productivity" && (
            <div className="hidden shrink-0 items-center gap-1 rounded-md bg-emerald-50/95 px-2 py-1 text-[11px] font-medium text-emerald-900 sm:flex dark:bg-emerald-950/35 dark:text-emerald-200">
              <FireIcon className="h-3.5 w-3.5" />
              12-day streak
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          {id === "team-productivity" ? (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <MiniBars values={[42, 55, 38, 62, 58, 70, 66]} />
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Completed tasks / day · last 7 days
                  </p>
                </div>
                <ProductivityRing score={87} />
              </div>
            </div>
          ) : (
            <WidgetBody id={id} />
          )}
        </div>
      </div>
    </div>
  );
}

function parseOrder(raw: string | null): WidgetId[] {
  if (!raw) return [...DEFAULT_WIDGET_ORDER];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_WIDGET_ORDER];
    const set = new Set(DEFAULT_WIDGET_ORDER);
    const ordered = parsed.filter((x): x is WidgetId => typeof x === "string" && set.has(x as WidgetId));
    const missing = DEFAULT_WIDGET_ORDER.filter((id) => !ordered.includes(id));
    return [...ordered, ...missing];
  } catch {
    return [...DEFAULT_WIDGET_ORDER];
  }
}

export function DashboardWidgetGrid() {
  const dndId = useId();
  const [order, setOrder] = useState<WidgetId[]>(() =>
    parseOrder(typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }, [order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as WidgetId);
      const newIndex = prev.indexOf(over.id as WidgetId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const items = useMemo(() => order, [order]);

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((id, index) => (
            <SortableWidgetCard key={id} id={id} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
