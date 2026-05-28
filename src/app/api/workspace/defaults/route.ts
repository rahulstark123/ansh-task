import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_KANBAN_ORDER = ["todo", "in_progress", "blocked", "overdue", "done"];

function normalizeKanbanOrder(order?: string[] | null) {
  const base = Array.isArray(order) && order.length > 0 ? order : DEFAULT_KANBAN_ORDER;
  const deduped = Array.from(new Set(base));
  if (!deduped.includes("overdue")) {
    const doneIndex = deduped.indexOf("done");
    if (doneIndex === -1) deduped.push("overdue");
    else deduped.splice(doneIndex, 0, "overdue");
  }
  return deduped;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");

    if (!widParam) {
      return NextResponse.json(
        { success: false, error: "Workspace ID (wid) is required" },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(widParam, 10);
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        defaultPriority: true,
        defaultStatus: true,
        defaultCategory: true,
        defaultLabels: true,
        customCategories: true,
        customLabels: true,
        kanbanColumnOrder: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({
        success: true,
        defaults: {
          priority: "medium",
          status: "todo",
          category: "General",
          labels: [],
        },
        customCategories: ["General", "Product", "Engineering", "Design", "Operations", "Marketing"],
        customLabels: ["Bug", "Feature", "Improvement", "Docs", "Design", "Meeting"],
        kanbanColumnOrder: DEFAULT_KANBAN_ORDER,
      });
    }

    const normalizedOrder = normalizeKanbanOrder(workspace.kanbanColumnOrder);
    if (normalizedOrder.join("|") !== (workspace.kanbanColumnOrder || []).join("|")) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { kanbanColumnOrder: normalizedOrder },
      });
    }

    return NextResponse.json({
      success: true,
      defaults: {
        priority: workspace.defaultPriority,
        status: workspace.defaultStatus,
        category: workspace.defaultCategory,
        labels: workspace.defaultLabels,
      },
      customCategories: workspace.customCategories,
      customLabels: workspace.customLabels,
      kanbanColumnOrder: normalizedOrder,
    });
  } catch (error: any) {
    console.error("Workspace defaults GET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch workspace defaults" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      priority,
      status,
      category,
      labels,
      customCategories,
      customLabels,
      kanbanColumnOrder,
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const wid = parseInt(workspaceId, 10);

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: wid },
      data: {
        defaultPriority: priority !== undefined ? priority : undefined,
        defaultStatus: status !== undefined ? status : undefined,
        defaultCategory: category !== undefined ? category : undefined,
        defaultLabels: labels !== undefined ? labels : undefined,
        customCategories: customCategories !== undefined ? customCategories : undefined,
        customLabels: customLabels !== undefined ? customLabels : undefined,
        kanbanColumnOrder: kanbanColumnOrder !== undefined ? normalizeKanbanOrder(kanbanColumnOrder) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Workspace defaults updated successfully",
      defaults: {
        priority: updatedWorkspace.defaultPriority,
        status: updatedWorkspace.defaultStatus,
        category: updatedWorkspace.defaultCategory,
        labels: updatedWorkspace.defaultLabels,
      },
      customCategories: updatedWorkspace.customCategories,
      customLabels: updatedWorkspace.customLabels,
      kanbanColumnOrder: normalizeKanbanOrder(updatedWorkspace.kanbanColumnOrder),
    });
  } catch (error: any) {
    console.error("Workspace defaults PATCH API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update workspace defaults" },
      { status: 500 }
    );
  }
}
