export type ActivityCategory = "task" | "project" | "member" | "ticket" | "announcement" | "brainboard";

export type ActivityAction = "created" | "updated" | "joined" | "posted" | "resolved";

export type ActivityFeedItem = {
  id: string;
  category: ActivityCategory;
  action: ActivityAction;
  title: string;
  description?: string;
  actorName?: string;
  timestamp: string;
  link?: string;
  categoryLabel: string;
  actionLabel: string;
  destination?: string;
  context?: string;
};

export function formatPersonName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}) {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email.split("@")[0];
}

function formatActionLabel(action: ActivityAction) {
  switch (action) {
    case "created":
      return "Created";
    case "updated":
      return "Updated";
    case "joined":
      return "Joined";
    case "posted":
      return "Posted";
    case "resolved":
      return "Resolved";
    default:
      return "Activity";
  }
}

function formatCategoryLabel(category: ActivityCategory) {
  switch (category) {
    case "task":
      return "Task";
    case "project":
      return "Project";
    case "member":
      return "Team member";
    case "ticket":
      return "Support ticket";
    case "announcement":
      return "Announcement";
    case "brainboard":
      return "Brain board";
    default:
      return "Workspace";
  }
}

function isRecentlyCreated(createdAt: Date, updatedAt: Date) {
  return Math.abs(updatedAt.getTime() - createdAt.getTime()) < 60_000;
}

export function taskToActivityItems(task: {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  project?: { name: string } | null;
}): ActivityFeedItem[] {
  const projectLabel = task.project?.name ? ` in ${task.project.name}` : "";
  const created = isRecentlyCreated(task.createdAt, task.updatedAt);

  if (created) {
    return [
      {
        id: `task-created-${task.id}`,
        category: "task",
        action: "created",
        title: task.title,
        description: `New task added to the workspace${projectLabel}`,
        timestamp: task.createdAt.toISOString(),
        link: "/tasks",
        categoryLabel: formatCategoryLabel("task"),
        actionLabel: formatActionLabel("created"),
        destination: "Task list",
        context: task.project?.name ? `Project · ${task.project.name}` : "Workspace task",
      },
    ];
  }

  return [
    {
      id: `task-updated-${task.id}-${task.updatedAt.getTime()}`,
      category: "task",
      action: "updated",
      title: task.title,
      description: `Status changed to ${task.status.replace(/_/g, " ")}${projectLabel}`,
      timestamp: task.updatedAt.toISOString(),
      link: "/tasks",
      categoryLabel: formatCategoryLabel("task"),
      actionLabel: formatActionLabel("updated"),
      destination: "Task list",
      context: task.project?.name ? `Project · ${task.project.name}` : "Workspace task",
    },
  ];
}

export function projectToActivityItems(project: {
  id: string;
  name: string;
  progress: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ActivityFeedItem[] {
  if (isRecentlyCreated(project.createdAt, project.updatedAt)) {
    return [
      {
        id: `project-created-${project.id}`,
        category: "project",
        action: "created",
        title: project.name,
        description: `New project launched with status ${project.status}`,
        timestamp: project.createdAt.toISOString(),
        link: "/projects",
        categoryLabel: formatCategoryLabel("project"),
        actionLabel: formatActionLabel("created"),
        destination: "Projects",
        context: `${project.progress}% progress`,
      },
    ];
  }

  return [
    {
      id: `project-updated-${project.id}-${project.updatedAt.getTime()}`,
      category: "project",
      action: "updated",
      title: project.name,
      description: `Project progress and status were updated`,
      timestamp: project.updatedAt.toISOString(),
      link: "/projects",
      categoryLabel: formatCategoryLabel("project"),
      actionLabel: formatActionLabel("updated"),
      destination: "Projects",
      context: `${project.progress}% complete · ${project.status}`,
    },
  ];
}

export function memberToActivityItem(member: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  createdAt: Date;
}): ActivityFeedItem {
  return {
    id: `member-joined-${member.id}`,
    category: "member",
    action: "joined",
    title: formatPersonName(member),
    description: `New teammate joined the workspace`,
    actorName: formatPersonName(member),
    timestamp: member.createdAt.toISOString(),
    link: "/management/teams",
    categoryLabel: formatCategoryLabel("member"),
    actionLabel: formatActionLabel("joined"),
    destination: "Teams",
    context: `Role · ${member.role}`,
  };
}

export function ticketToActivityItems(ticket: {
  id: string;
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}): ActivityFeedItem[] {
  if (isRecentlyCreated(ticket.createdAt, ticket.updatedAt)) {
    return [
      {
        id: `ticket-created-${ticket.id}`,
        category: "ticket",
        action: "created",
        title: ticket.subject,
        description: `New support ticket submitted to the help desk`,
        timestamp: ticket.createdAt.toISOString(),
        link: "/support",
        categoryLabel: formatCategoryLabel("ticket"),
        actionLabel: formatActionLabel("created"),
        destination: "Support",
        context: `${ticket.ticketId} · ${ticket.priority} priority`,
      },
    ];
  }

  const action: ActivityAction = ticket.status === "Resolved" ? "resolved" : "updated";

  return [
    {
      id: `ticket-updated-${ticket.id}-${ticket.updatedAt.getTime()}`,
      category: "ticket",
      action,
      title: ticket.subject,
      description:
        action === "resolved"
          ? "Support ticket marked as resolved"
          : "Support ticket status was updated",
      timestamp: ticket.updatedAt.toISOString(),
      link: "/support",
      categoryLabel: formatCategoryLabel("ticket"),
      actionLabel: formatActionLabel(action),
      destination: "Support",
      context: `${ticket.ticketId} · ${ticket.status}`,
    },
  ];
}

export function announcementToActivityItem(announcement: {
  id: string;
  title: string;
  createdAt: Date;
  author: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
}): ActivityFeedItem {
  const actorName = formatPersonName(announcement.author);
  return {
    id: `announcement-posted-${announcement.id}`,
    category: "announcement",
    action: "posted",
    title: announcement.title,
    description: `Workspace announcement published for the team`,
    actorName,
    timestamp: announcement.createdAt.toISOString(),
    link: "/management/announcements",
    categoryLabel: formatCategoryLabel("announcement"),
    actionLabel: formatActionLabel("posted"),
    destination: "Announcements",
    context: `Posted by ${actorName}`,
  };
}

export function brainboardToActivityItem(note: {
  id: string;
  title: string;
  createdAt: Date;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
}): ActivityFeedItem {
  const actorName = formatPersonName(note.user);
  return {
    id: `brainboard-created-${note.id}`,
    category: "brainboard",
    action: "created",
    title: note.title,
    description: `New sticky note added to the brain board`,
    actorName,
    timestamp: note.createdAt.toISOString(),
    link: "/brain-board",
    categoryLabel: formatCategoryLabel("brainboard"),
    actionLabel: formatActionLabel("created"),
    destination: "Brain board",
    context: `Created by ${actorName}`,
  };
}

export function sortActivityFeed(items: ActivityFeedItem[]) {
  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function mergeActivityFeed(items: ActivityFeedItem[], limit: number) {
  return sortActivityFeed(items).slice(0, limit);
}

export function paginateActivityFeed(
  items: ActivityFeedItem[],
  page: number,
  pageSize: number
) {
  const sorted = sortActivityFeed(items);
  const total = sorted.length;
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;
  const pageItems = sorted.slice(offset, offset + pageSize);

  return {
    items: pageItems,
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: offset + pageSize < total,
  };
}

export function filterActivityFeed(
  items: ActivityFeedItem[],
  filter: string | null
): ActivityFeedItem[] {
  if (!filter || filter === "all") return items;

  const map: Record<string, ActivityCategory[]> = {
    tasks: ["task"],
    projects: ["project"],
    team: ["member", "announcement"],
    support: ["ticket"],
  };

  const categories = map[filter];
  if (!categories) return items;
  return items.filter((item) => categories.includes(item.category));
}
