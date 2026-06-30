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
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        workspace: { select: { id: true, name: true, billingEmail: true, plan: true } },
        _count: { select: { transactions: true } },
      },
    });

    return NextResponse.json({ success: true, subscriptions });
  } catch (err: unknown) {
    console.error("Admin subscriptions GET:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch subscriptions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
