import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FREE_PLAN_TASKS_PER_MONTH_LIMIT,
  getEffectiveWorkspacePlan,
  getWorkspaceTaskCountThisMonth,
} from "@/lib/planLimits";
import { UPGRADE_REQUIRED_CODE } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error: any) {
    console.error("Project tasks GET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, projectId, workspaceId, priority, status, assignee, assignees, due, description, category, labels, estimate } = body;

    if (!title || !workspaceId) {
      return NextResponse.json(
        { success: false, error: "Title and Workspace ID are required" },
        { status: 400 }
      );
    }

    const wid = parseInt(workspaceId, 10);
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
    const resolvedAssignee = resolvedAssignees.length > 0 ? resolvedAssignees[0] : "Unassigned";

    const newTask = await prisma.task.create({
      data: {
        title,
        projectId: projectId || null,
        workspaceId: wid,
        priority: priority || "medium",
        status: status || "todo",
        assignee: resolvedAssignee,
        assignees: resolvedAssignees,
        due: due || "No date",
        done: status === "done",
        description: description || null,
        category: category || "General",
        labels: labels || [],
        estimate: estimate || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error: any) {
    console.error("Project tasks POST API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
