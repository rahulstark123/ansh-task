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
    const [
      openTickets,
      totalTickets,
      activeSubscriptions,
      totalSubscriptions,
      successfulTransactions,
      totalRevenuePaisa,
    ] = await Promise.all([
      prisma.ticket.count({ where: { status: "Open" } }),
      prisma.ticket.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count(),
      prisma.transaction.count({ where: { status: "SUCCESS" } }),
      prisma.transaction.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amountPaisa: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        openTickets,
        totalTickets,
        activeSubscriptions,
        totalSubscriptions,
        successfulTransactions,
        totalRevenuePaisa: totalRevenuePaisa._sum.amountPaisa ?? 0,
      },
    });
  } catch (err: unknown) {
    console.error("Admin stats GET:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
