export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export type Task = {
  id: string;
  title: string;
  description?: string;
  due: string;
  priority: TaskPriority;
  category?: string;
  labels?: string[];
  assignee?: string;
  status?: TaskStatus;
  estimate?: string;
  done: boolean;
};

export type NewTaskPayload = {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueLabel: string;
  labels: string[];
  assignee: string;
  estimate?: string;
  projectId?: string | null;
};
