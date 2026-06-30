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
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        workspace: { select: { id: true, name: true, billingEmail: true } },
        subscription: {
          select: { id: true, plan: true, billingCycle: true, status: true },
        },
      },
    });

    return NextResponse.json({ success: true, transactions });
  } catch (err: unknown) {
    console.error("Admin transactions GET:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch transactions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
