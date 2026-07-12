import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchR2Object } from "@/lib/storage/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const wid = parseInt(searchParams.get("wid") ?? "0", 10);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Receipt ID is required" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(wid) || wid <= 0) {
      return NextResponse.json(
        { success: false, error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const receipt = await prisma.receipt.findFirst({
      where: {
        id,
        workspaceId: wid,
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: "Receipt not found" },
        { status: 404 }
      );
    }

    const { body, contentType } = await fetchR2Object(receipt.fileKey);
    const filename = `${receipt.receiptNumber}.pdf`;

    return new NextResponse(Buffer.from(body), {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[billing/receipts/pdf] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to download receipt";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
