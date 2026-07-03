import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FREE_PLAN_PROJECTS_LIMIT,
  getEffectiveWorkspacePlan,
  getWorkspaceProjectCount,
} from "@/lib/planLimits";
import { UPGRADE_REQUIRED_CODE } from "@/lib/plans";
import { formatApiError } from "@/lib/apiErrors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");
    const emailParam = searchParams.get("email");

    let workspaceId: number | null = null;

    if (widParam) {
      workspaceId = parseInt(widParam, 10);
    } else if (emailParam) {
      const dbUser = await prisma.user.findUnique({
        where: { email: emailParam },
        select: { workspaceId: true },
      });
      if (dbUser) {
        workspaceId = dbUser.workspaceId;
      }
    }

    if (!workspaceId) {
      workspaceId = 1;
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error: unknown) {
    console.error("Projects GET API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: formatApiError(error, "Could not load projects. Please try again."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      owner,
      startDate,
      due,
      priority,
      status,
      health,
      estimatedHours,
      members,
      workspaceId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      );
    }

    const wid = workspaceId ? parseInt(String(workspaceId), 10) : 1;
    if (!Number.isFinite(wid)) {
      return NextResponse.json(
        { success: false, error: "Invalid workspace. Please refresh the page and try again." },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: wid },
      select: { id: true },
    });
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found. Please refresh the page and try again." },
        { status: 400 }
      );
    }

    const currentPlan = await getEffectiveWorkspacePlan(wid);
    if (currentPlan === "free") {
      const projectCount = await getWorkspaceProjectCount(wid);
      if (projectCount >= FREE_PLAN_PROJECTS_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            code: UPGRADE_REQUIRED_CODE,
            feature: "projectsLimit",
            error: `Free plan workspaces can create up to ${FREE_PLAN_PROJECTS_LIMIT} projects. Upgrade to PRO to create more.`,
          },
          { status: 403 }
        );
      }
    }

    const projectData = {
      name,
      description: description || null,
      category: category || "General",
      owner: owner || "Aisha Khan",
      startDate: startDate ? new Date(startDate) : new Date(),
      priority: priority || "Normal",
      status: status || "Discovery",
      health: health || "good",
      estimatedHours: parseInt(estimatedHours, 10) || 0,
      members: members || [],
      workspaceId: wid,
      ...(due ? { due: new Date(due) } : {}),
    };

    const newProject = await prisma.project.create({
      data: projectData,
    });

    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      project: newProject,
    });
  } catch (error: unknown) {
    console.error("Projects POST API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: formatApiError(error, "Could not create the project. Please try again."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      category,
      owner,
      startDate,
      due,
      priority,
      status,
      health,
      estimatedHours,
      progress,
      members,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required for update" },
        { status: 400 }
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        owner: owner !== undefined ? owner : undefined,
        startDate: startDate !== undefined && startDate ? new Date(startDate) : undefined,
        ...(due !== undefined
          ? due
            ? { due: new Date(due) }
            : { due: null }
          : {}),
        priority: priority !== undefined ? priority : undefined,
        status: status !== undefined ? status : undefined,
        health: health !== undefined ? health : undefined,
        estimatedHours: estimatedHours !== undefined ? parseInt(estimatedHours, 10) : undefined,
        progress: progress !== undefined ? parseInt(progress, 10) : undefined,
        members: members !== undefined ? members : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error: unknown) {
    console.error("Projects PATCH API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: formatApiError(error, "Could not update the project. Please try again."),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required for deletion" },
        { status: 400 }
      );
    }

    // Optional: Delete related tasks or clear relation if needed
    // Since task has projectId as optional, we can set them to null or delete them.
    // Let's set the projectId to null first so we don't break foreign key constraints if onDelete is not set.
    await prisma.task.updateMany({
      where: { projectId: id },
      data: { projectId: null },
    });

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Projects DELETE API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: formatApiError(error, "Could not delete the project. Please try again."),
      },
      { status: 500 }
    );
  }
}
