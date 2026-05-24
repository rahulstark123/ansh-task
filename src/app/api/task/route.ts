import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────
   GET  /api/task?wid=<id>&projectId=<id>
   Returns all tasks for a workspace,
   optionally filtered by project.
───────────────────────────────────────── */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");
    const projectId = searchParams.get("projectId");
    const emailParam = searchParams.get("email");

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

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
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
        assignee: assignee || null,
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
      estimate,
      projectId,
      done,
      attachmentUrls,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required for update" },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.task.update({
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
        assignee: assignee !== undefined ? assignee : undefined,
        estimate: estimate !== undefined ? estimate : undefined,
        done: done !== undefined ? done : status !== undefined ? status === "done" : undefined,
        attachmentUrls: attachmentUrls !== undefined ? attachmentUrls : undefined,
        projectId: projectId !== undefined ? projectId : undefined,
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
