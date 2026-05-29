import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: ticketId } = await context.params;
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");

    if (!widParam) {
      return NextResponse.json({ success: false, error: "Workspace ID (wid) is required" }, { status: 400 });
    }

    const workspaceId = parseInt(widParam, 10);
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, workspaceId },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, replies: ticket.replies });
  } catch (err: unknown) {
    console.error("Support replies GET:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch replies";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { user, error } = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: ticketId } = await context.params;
    const body = await request.json();
    const message = (body.message as string)?.trim();
    const widParam = body.workspaceId ?? body.wid;

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    if (!widParam) {
      return NextResponse.json({ success: false, error: "Workspace ID is required" }, { status: 400 });
    }

    const workspaceId = parseInt(String(widParam), 10);
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, workspaceId },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.status === "Resolved") {
      return NextResponse.json(
        { success: false, error: "Cannot reply to a resolved ticket" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email ?? "" },
      select: { firstName: true, lastName: true, email: true },
    });

    const authorName =
      [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(" ") ||
      user.email?.split("@")[0] ||
      "User";

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        message,
        authorRole: "user",
        authorName,
        authorEmail: user.email ?? undefined,
      },
    });

    return NextResponse.json({ success: true, reply });
  } catch (err: unknown) {
    console.error("Support reply POST:", err);
    const message = err instanceof Error ? err.message : "Failed to post reply";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
