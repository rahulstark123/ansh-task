import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { title, projectId, workspaceId, priority, status, assignee, due, description, category, labels, estimate } = body;

    if (!title || !workspaceId) {
      return NextResponse.json(
        { success: false, error: "Title and Workspace ID are required" },
        { status: 400 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        projectId: projectId || null,
        workspaceId: parseInt(workspaceId, 10),
        priority: priority || "medium",
        status: status || "todo",
        assignee: assignee || "Unassigned",
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
