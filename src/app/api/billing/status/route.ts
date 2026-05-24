import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wid = parseInt(searchParams.get("wid") ?? "1", 10);

    const workspace = await prisma.workspace.findUnique({
      where: { id: wid },
      select: { plan: true, planExpiresAt: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Treat expired pro plans as free
    const now = new Date();
    const isPro =
      workspace.plan === "pro" &&
      (workspace.planExpiresAt === null || workspace.planExpiresAt > now);

    return NextResponse.json({
      success: true,
      plan: isPro ? "pro" : "free",
      planExpiresAt: workspace.planExpiresAt?.toISOString() ?? null,
    });
  } catch (error: any) {
    console.error("[billing/status] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch plan" },
      { status: 500 }
    );
  }
}
