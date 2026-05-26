import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FREE_PLAN_PROJECTS_LIMIT,
  getEffectiveWorkspacePlan,
  getWorkspaceProjectCount,
} from "@/lib/planLimits";
import { UPGRADE_REQUIRED_CODE } from "@/lib/plans";

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
  } catch (error: any) {
    console.error("Projects GET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects" },
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

    if (!name || !due) {
      return NextResponse.json(
        { success: false, error: "Project Name and Due Date are required fields" },
        { status: 400 }
      );
    }

    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;

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

    const newProject = await prisma.project.create({
      data: {
        name,
        description: description || null,
        category: category || "General",
        owner: owner || "Aisha Khan",
        startDate: startDate ? new Date(startDate) : new Date(),
        due: new Date(due),
        priority: priority || "Normal",
        status: status || "Discovery",
        health: health || "good",
        estimatedHours: parseInt(estimatedHours, 10) || 0,
        members: members || [],
        workspaceId: wid,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      project: newProject,
    });
  } catch (error: any) {
    console.error("Projects POST API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create project" },
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
        due: due !== undefined && due ? new Date(due) : undefined,
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
  } catch (error: any) {
    console.error("Projects PATCH API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update project" },
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
  } catch (error: any) {
    console.error("Projects DELETE API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete project" },
      { status: 500 }
    );
  }
}
