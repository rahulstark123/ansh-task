import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { user, error } = await getAdminUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: error === "Forbidden" ? "Forbidden" : "Unauthorized" },
      { status: error === "Forbidden" ? 403 : 401 }
    );
  }

  try {
    const { id: ticketId } = await context.params;
    const body = await request.json();
    const message = (body.message as string)?.trim();

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    const reply = await prisma.$transaction(async (tx) => {
      const created = await tx.ticketReply.create({
        data: {
          ticketId,
          message,
          authorRole: "admin",
          authorName: "ANSH Support",
          authorEmail: user.email ?? undefined,
        },
      });

      if (ticket.status === "Open") {
        await tx.ticket.update({
          where: { id: ticketId },
          data: { status: "In Progress" },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, reply });
  } catch (err: unknown) {
    console.error("Admin reply POST:", err);
    const message = err instanceof Error ? err.message : "Failed to post reply";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
