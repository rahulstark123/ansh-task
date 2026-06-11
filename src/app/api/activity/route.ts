import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProFeaturePlan } from "@/lib/planLimits";
import {
  announcementToActivityItem,
  brainboardToActivityItem,
  filterActivityFeed,
  memberToActivityItem,
  paginateActivityFeed,
  projectToActivityItems,
  taskToActivityItems,
  ticketToActivityItems,
} from "@/lib/activity-feed";

export const dynamic = "force-dynamic";

const MAX_PER_SOURCE = 100;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function perSourceTake(page: number, pageSize: number) {
  return Math.min(MAX_PER_SOURCE, page * pageSize + pageSize * 2);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");
    const filter = searchParams.get("filter");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );
    const sourceTake = perSourceTake(page, pageSize);

    if (!widParam) {
      return NextResponse.json(
        { success: false, error: "Workspace ID (wid) is required" },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(widParam, 10);

    const planDenied = await requireProFeaturePlan(workspaceId, "activityFeed");
    if (planDenied) return planDenied;

    const [tasks, projects, members, tickets, announcements, brainboardNotes] =
      await Promise.all([
        prisma.task.findMany({
          where: { workspaceId },
          include: { project: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
          take: sourceTake,
        }),
        prisma.project.findMany({
          where: { workspaceId },
          orderBy: { updatedAt: "desc" },
          take: sourceTake,
        }),
        prisma.user.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          take: sourceTake,
        }),
        prisma.ticket.findMany({
          where: { workspaceId },
          orderBy: { updatedAt: "desc" },
          take: sourceTake,
        }),
        prisma.announcement.findMany({
          where: { workspaceId, archived: false },
          include: {
            author: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: sourceTake,
        }),
        prisma.brainboardNote.findMany({
          where: { workspaceId },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: sourceTake,
        }),
      ]);

    const sourceLimitHit =
      tasks.length === sourceTake ||
      projects.length === sourceTake ||
      members.length === sourceTake ||
      tickets.length === sourceTake ||
      announcements.length === sourceTake ||
      brainboardNotes.length === sourceTake;

    const rawItems = [
      ...tasks.flatMap(taskToActivityItems),
      ...projects.flatMap(projectToActivityItems),
      ...members.map(memberToActivityItem),
      ...tickets.flatMap(ticketToActivityItems),
      ...announcements.map(announcementToActivityItem),
      ...brainboardNotes.map(brainboardToActivityItem),
    ];

    const filtered = filterActivityFeed(rawItems, filter);
    const pagination = paginateActivityFeed(filtered, page, pageSize);

    return NextResponse.json({
      success: true,
      items: pagination.items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasMore: pagination.hasMore || sourceLimitHit,
      },
    });
  } catch (error: unknown) {
    console.error("Activity GET API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch activity feed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
