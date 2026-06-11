import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPersonName } from "@/lib/activity-feed";
import { requireProFeaturePlan } from "@/lib/planLimits";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function canManageAnnouncements(role: string) {
  const normalized = normalizeRole(role);
  return normalized === "owner" || normalized === "admin";
}

function formatAnnouncementResponse(
  item: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: { firstName: string | null; lastName: string | null; email: string };
  }
) {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    pinned: item.pinned,
    archived: item.archived,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    authorName: formatPersonName(item.author),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");
    const includeArchived = searchParams.get("includeArchived") === "true";

    if (!widParam) {
      return NextResponse.json(
        { success: false, error: "Workspace ID (wid) is required" },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(widParam, 10);

    const planDenied = await requireProFeaturePlan(workspaceId, "announcements");
    if (planDenied) return planDenied;

    const announcements = await prisma.announcement.findMany({
      where: {
        workspaceId,
        ...(includeArchived ? {} : { archived: false }),
      },
      select: {
        id: true,
        title: true,
        body: true,
        pinned: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      announcements: announcements.map(formatAnnouncementResponse),
    });
  } catch (error: unknown) {
    console.error("Announcements GET API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch announcements";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workspaceId = parseInt(String(body.workspaceId ?? body.wid ?? ""), 10);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const announcementBody = typeof body.body === "string" ? body.body.trim() : "";
    const authorEmail = typeof body.email === "string" ? body.email.trim() : "";
    const pinned = Boolean(body.pinned);

    if (!workspaceId || !title || !announcementBody || !authorEmail) {
      return NextResponse.json(
        { success: false, error: "workspaceId, title, body, and email are required" },
        { status: 400 }
      );
    }

    const planDenied = await requireProFeaturePlan(workspaceId, "announcements");
    if (planDenied) return planDenied;

    const author = await prisma.user.findUnique({
      where: { email: authorEmail },
      select: { id: true, role: true, workspaceId: true },
    });

    if (!author || author.workspaceId !== workspaceId) {
      return NextResponse.json(
        { success: false, error: "Author not found in this workspace" },
        { status: 403 }
      );
    }

    if (!canManageAnnouncements(author.role)) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can post announcements" },
        { status: 403 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: announcementBody,
        pinned,
        workspaceId,
        authorId: author.id,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      announcement: formatAnnouncementResponse(announcement),
    });
  } catch (error: unknown) {
    console.error("Announcements POST API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create announcement";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const authorEmail = typeof body.email === "string" ? body.email.trim() : "";

    if (!id || !authorEmail) {
      return NextResponse.json(
        { success: false, error: "id and email are required" },
        { status: 400 }
      );
    }

    const author = await prisma.user.findUnique({
      where: { email: authorEmail },
      select: { id: true, role: true, workspaceId: true },
    });

    if (!author || !canManageAnnouncements(author.role)) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can update announcements" },
        { status: 403 }
      );
    }

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== author.workspaceId) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    const planDenied = await requireProFeaturePlan(existing.workspaceId, "announcements");
    if (planDenied) return planDenied;

    const data: {
      title?: string;
      body?: string;
      pinned?: boolean;
      archived?: boolean;
    } = {};

    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (typeof body.body === "string" && body.body.trim()) data.body = body.body.trim();
    if (typeof body.pinned === "boolean") data.pinned = body.pinned;
    if (typeof body.archived === "boolean") data.archived = body.archived;

    const announcement = await prisma.announcement.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      announcement: formatAnnouncementResponse(announcement),
    });
  } catch (error: unknown) {
    console.error("Announcements PATCH API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update announcement";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id || !email) {
      return NextResponse.json(
        { success: false, error: "id and email are required" },
        { status: 400 }
      );
    }

    const author = await prisma.user.findUnique({
      where: { email },
      select: { role: true, workspaceId: true },
    });

    if (!author || !canManageAnnouncements(author.role)) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can delete announcements" },
        { status: 403 }
      );
    }

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== author.workspaceId) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    const planDenied = await requireProFeaturePlan(existing.workspaceId, "announcements");
    if (planDenied) return planDenied;

    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Announcements DELETE API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete announcement";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
