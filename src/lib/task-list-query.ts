import type { Prisma } from "@prisma/client";
import { getMemberAssigneeKeys } from "@/lib/task-assignee";

export const DEFAULT_TASK_PAGE_SIZE = 10;

function parseCsv(param: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type TaskListQueryParams = {
  workspaceId: number;
  projectId?: string | null;
  search?: string | null;
  priority?: string | null;
  assignees?: string | null;
  categories?: string | null;
  labels?: string | null;
  scope?: string | null;
  email?: string | null;
  page?: string | null;
  limit?: string | null;
};

export async function buildTaskWhereInput(
  params: TaskListQueryParams,
  prismaUserLookup: (email: string) => Promise<{
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null>
): Promise<Prisma.TaskWhereInput> {
  const where: Prisma.TaskWhereInput = {
    workspaceId: params.workspaceId,
    ...(params.projectId ? { projectId: params.projectId } : {}),
  };

  const andParts: Prisma.TaskWhereInput[] = [];

  const search = params.search?.trim();
  if (search) {
    andParts.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const priority = params.priority?.trim();
  if (priority && priority.toLowerCase() !== "all") {
    andParts.push({ priority: priority.toLowerCase() });
  }

  const categories = parseCsv(params.categories ?? null);
  if (categories.length > 0) {
    andParts.push({ category: { in: categories } });
  }

  const labels = parseCsv(params.labels ?? null);
  if (labels.length > 0) {
    andParts.push({ labels: { hasSome: labels } });
  }

  const assignees = parseCsv(params.assignees ?? null);
  if (assignees.length > 0) {
    andParts.push({
      OR: assignees.flatMap((name) => [
        { assignee: name },
        { assignees: { has: name } },
      ]),
    });
  }

  if (params.scope === "my" && params.email) {
    const user = await prismaUserLookup(params.email);
    if (user) {
      const keys = getMemberAssigneeKeys(user);
      const orConditions: Prisma.TaskWhereInput[] = [];
      for (const key of keys) {
        orConditions.push({ assignee: { equals: key, mode: "insensitive" } });
        orConditions.push({ assignees: { has: key } });
      }
      orConditions.push({ assignee: { equals: "Me", mode: "insensitive" } });
      orConditions.push({ assignees: { has: "Me" } });
      andParts.push({ OR: orConditions });
    }
  }

  if (andParts.length > 0) {
    where.AND = andParts;
  }

  return where;
}

export function parseTaskPagination(params: {
  page?: string | null;
  limit?: string | null;
}) {
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(params.limit || String(DEFAULT_TASK_PAGE_SIZE), 10) || DEFAULT_TASK_PAGE_SIZE)
  );
  return { page, limit, skip: (page - 1) * limit };
}
