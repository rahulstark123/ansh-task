import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FREE_PLAN_TASKS_PER_MONTH_LIMIT,
  getEffectiveWorkspacePlan,
  getWorkspaceTaskCountThisMonth,
} from "@/lib/planLimits";
import { UPGRADE_REQUIRED_CODE } from "@/lib/plans";
import {
  buildTaskWhereInput,
  parseTaskPagination,
} from "@/lib/task-list-query";

export const dynamic = "force-dynamic";

const taskInclude = { project: { select: { name: true } } } as const;

/* ─────────────────────────────────────────
   GET  /api/task?wid=<id>&projectId=<id>
   Optional pagination: page & limit (default 10)
   Optional filters: search, priority, assignees,
   categories, labels, scope=my&email=
───────────────────────────────────────── */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");
    const projectId = searchParams.get("projectId");
    const emailParam = searchParams.get("email");
    const pageParam = searchParams.get("page");

    let workspaceId: number | null = null;

    if (widParam) {
      workspaceId = parseInt(widParam, 10);
    } else if (emailParam) {
      const dbUser = await prisma.user.findUnique({
        where: { email: emailParam },
        select: { workspaceId: true },
      });
      if (dbUser) workspaceId = dbUser.workspaceId;
    }

    if (!workspaceId) workspaceId = 1;

    const where = await buildTaskWhereInput(
      {
        workspaceId,
        projectId,
        search: searchParams.get("search"),
        priority: searchParams.get("priority"),
        assignees: searchParams.get("assignees"),
        categories: searchParams.get("categories"),
        labels: searchParams.get("labels"),
        scope: searchParams.get("scope"),
        email: emailParam,
        page: pageParam,
        limit: searchParams.get("limit"),
      },
      async (email) =>
        prisma.user.findUnique({
          where: { email },
          select: { firstName: true, lastName: true, email: true },
        })
    );

    const orderBy = { createdAt: "desc" as const };

    if (pageParam !== null) {
      const { page, limit, skip } = parseTaskPagination({
        page: pageParam,
        limit: searchParams.get("limit"),
      });

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: taskInclude,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.task.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy,
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error("Task GET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────
   POST /api/task
   Body: { title, description?, category?, priority?,
           status?, due?, labels?, assignee?,
           estimate?, projectId?, workspaceId? }
───────────────────────────────────────── */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      status,
      due,
      labels,
      assignee,
      assignees,
      estimate,
      projectId,
      workspaceId,
      attachmentUrls,
      notes,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Task title is required" },
        { status: 400 }
      );
    }

    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;

    const currentPlan = await getEffectiveWorkspacePlan(wid);
    if (currentPlan === "free") {
      const tasksThisMonth = await getWorkspaceTaskCountThisMonth(wid);
      if (tasksThisMonth >= FREE_PLAN_TASKS_PER_MONTH_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            code: UPGRADE_REQUIRED_CODE,
            feature: "tasksLimit",
            error: `Free plan workspaces can create up to ${FREE_PLAN_TASKS_PER_MONTH_LIMIT} tasks per month. Upgrade to PRO to create more.`,
          },
          { status: 403 }
        );
      }
    }

    const resolvedAssignees = assignees || (assignee ? [assignee] : []);
    const resolvedAssignee = resolvedAssignees.length > 0 ? resolvedAssignees[0] : null;

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        notes: notes || null,
        category: category || "General",
        priority: priority || "medium",
        status: status || "todo",
        due: due || "No date",
        labels: labels || [],
        assignee: resolvedAssignee,
        assignees: resolvedAssignees,
        estimate: estimate || null,
        done: status === "done",
        attachmentUrls: attachmentUrls || [],
        workspaceId: wid,
        projectId: projectId || null,
      },
      include: { project: { select: { name: true } } },
    });

    return NextResponse.json({
      success: true,
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error: any) {
    console.error("Task POST API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────
   PATCH /api/task
   Body: { id, ...fields to update }
───────────────────────────────────────── */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      category,
      priority,
      status,
      due,
      labels,
      assignee,
      assignees,
      estimate,
      projectId,
      done,
      attachmentUrls,
      notes,
      summary,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required for update" },
        { status: 400 }
      );
    }

    const updatedTask = await (prisma.task.update as any)({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        notes: notes !== undefined ? notes : undefined,
        category: category !== undefined ? category : undefined,
        priority: priority !== undefined ? priority : undefined,
        status: status !== undefined ? status : undefined,
        due: due !== undefined ? due : undefined,
        labels: labels !== undefined ? labels : undefined,
        assignees: assignees !== undefined ? assignees : undefined,
        assignee: assignees !== undefined
          ? (assignees.length > 0 ? assignees[0] : null)
          : (assignee !== undefined ? assignee : undefined),
        estimate: estimate !== undefined ? estimate : undefined,
        done: done !== undefined ? done : status !== undefined ? status === "done" : undefined,
        attachmentUrls: attachmentUrls !== undefined ? attachmentUrls : undefined,
        projectId: projectId !== undefined ? projectId : undefined,
        summary: summary !== undefined ? summary : undefined,
      },
      include: { project: { select: { name: true } } },
    });

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("Task PATCH API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────
   DELETE /api/task?id=<taskId>
───────────────────────────────────────── */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required for deletion" },
        { status: 400 }
      );
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    console.error("Task DELETE API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
