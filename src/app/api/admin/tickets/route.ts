import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { user, error } = await getAdminUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: error === "Forbidden" ? "Forbidden" : "Unauthorized" },
      { status: error === "Forbidden" ? 403 : 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const tickets = await prisma.ticket.findMany({
      where: status && status !== "All" ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      include: {
        workspace: { select: { id: true, name: true } },
        replies: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { replies: true } },
      },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (err: unknown) {
    console.error("Admin tickets GET:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch tickets";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
