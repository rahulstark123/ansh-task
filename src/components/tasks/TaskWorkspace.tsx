"use client";

import { TaskDashboard } from "@/components/dashboard/TaskDashboard";

const copy: Record<
  "list" | "my" | "all",
  { eyebrow: string; heading: string; description: string; banner?: string }
> = {
  list: {
    eyebrow: "Task management",
    heading: "Task list",
    description:
      "All tasks in one place — wire filters to Prisma later. Search, labels, priority, due dates, and assignees will map to your schema.",
  },
  my: {
    eyebrow: "Assigned to you",
    heading: "My tasks",
    description:
      "Your personal queue — the slice of work you own, similar to “My issues” in Jira or starred items in Slack.",
    banner: "Showing tasks where assignee = you (UI placeholder).",
  },
  all: {
    eyebrow: "Organization-wide",
    heading: "All tasks",
    description:
      "Cross-team visibility for admins and leads — combine with permissions from the Teams module.",
    banner: "Across every project and channel (UI placeholder).",
  },
};

export function TaskWorkspace({ variant }: { variant: "list" | "my" | "all" }) {
  const c = copy[variant];
  return (
    <TaskDashboard
      eyebrow={c.eyebrow}
      heading={c.heading}
      description={c.description}
      banner={c.banner}
      taskModule={variant}
      showBottomSpotlights={false}
    />
  );
}
