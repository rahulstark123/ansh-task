export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "on_hold" | "blocked" | "overdue" | "done" | (string & {});

export type TaskNote = {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  due: string;
  priority: TaskPriority;
  category?: string;
  labels?: string[];
  assignee?: string;
  assignees?: string[];
  status?: TaskStatus;
  estimate?: string;
  done: boolean;
  attachmentUrls?: string[];
  projectId?: string | null;
  createdAt?: string;
};

export type NewTaskPayload = {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueLabel: string;
  labels: string[];
  assignees: string[];
  designation?: string;
  role?: string;
  estimate?: string;
  projectId?: string | null;
  attachmentUrls?: string[];
};
