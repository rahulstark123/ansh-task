import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { user, error } = await getAdminUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: error === "Forbidden" ? "Forbidden" : "Unauthorized" },
      { status: error === "Forbidden" ? 403 : 401 }
    );
  }

  try {
    const { id } = await context.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        workspace: { select: { id: true, name: true, billingEmail: true } },
        replies: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (err: unknown) {
    console.error("Admin ticket GET:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch ticket";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await getAdminUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: error === "Forbidden" ? "Forbidden" : "Unauthorized" },
      { status: error === "Forbidden" ? 403 : 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = body.status as string | undefined;
    const priority = body.priority as string | undefined;

    const allowedStatuses = ["Open", "In Progress", "Resolved"];
    const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

    const data: { status?: string; priority?: string } = {};
    if (status && allowedStatuses.includes(status)) data.status = status;
    if (priority && allowedPriorities.includes(priority)) data.priority = priority;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        workspace: { select: { id: true, name: true } },
        replies: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (err: unknown) {
    console.error("Admin ticket PATCH:", err);
    const message = err instanceof Error ? err.message : "Failed to update ticket";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
