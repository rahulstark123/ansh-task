import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildWorkspaceStorageKey,
  sanitizeStorageSegment,
  uploadToR2,
} from "@/lib/storage/r2";
import {
  isSupportImageFile,
  validateSupportAttachments,
} from "@/lib/support-attachments";

export const dynamic = "force-dynamic";

function parseTicketSerial(ticketId: string): number | null {
  const match = /^TCK-(\d+)$/.exec(ticketId);
  if (!match) return null;
  const serial = Number.parseInt(match[1], 10);
  return Number.isFinite(serial) ? serial : null;
}

async function generateTicketId(): Promise<string> {
  const rows = await prisma.ticket.findMany({
    select: { ticketId: true },
  });

  let maxSerial = 1000;
  for (const row of rows) {
    const serial = parseTicketSerial(row.ticketId);
    if (serial !== null) maxSerial = Math.max(maxSerial, serial);
  }

  return `TCK-${maxSerial + 1}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");

    if (!widParam) {
      return NextResponse.json(
        { success: false, error: "Workspace ID (wid) is required" },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(widParam, 10);
    const tickets = await prisma.ticket.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error: unknown) {
    console.error("Support GET API Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch support tickets";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const workspaceIdParam = formData.get("workspaceId") as string;
    const subject = formData.get("subject") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;
    const description = formData.get("description") as string;
    const files = formData.getAll("files") as File[];

    if (!workspaceIdParam || !subject || !description) {
      return NextResponse.json(
        { success: false, error: "Workspace ID, subject, and description are required fields" },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(workspaceIdParam, 10);

    const attachmentFiles = (files ?? []).filter((file) => file.size > 0);
    if (attachmentFiles.length > 0) {
      const validation = validateSupportAttachments(attachmentFiles);
      if (!validation.ok) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }
    }

    let newTicket = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const ticketId = await generateTicketId();
      const attachmentUrls: string[] = [];

      if (files && files.length > 0) {
        for (const file of files) {
          if (file.size === 0 || !isSupportImageFile(file)) continue;
          try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = sanitizeStorageSegment(file.name) || "attachment";
            const key = buildWorkspaceStorageKey(
              workspaceId,
              "tickets",
              `${ticketId}-${fileName}`
            );

            const { url } = await uploadToR2({
              key,
              body: buffer,
              contentType: file.type || "application/octet-stream",
            });
            attachmentUrls.push(url);
          } catch (uploadError: unknown) {
            console.error(`R2 upload failed for file ${file.name}:`, uploadError);
          }
        }
      }

      try {
        newTicket = await prisma.ticket.create({
          data: {
            ticketId,
            subject,
            category: category || "Technical",
            priority: priority || "Medium",
            status: "Open",
            description,
            attachmentUrls,
            workspaceId,
          },
        });
        break;
      } catch (createError: unknown) {
        if (
          createError &&
          typeof createError === "object" &&
          "code" in createError &&
          createError.code === "P2002" &&
          attempt < 2
        ) {
          continue;
        }
        throw createError;
      }
    }

    if (!newTicket) {
      return NextResponse.json(
        { success: false, error: "Could not allocate a unique ticket ID. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket created successfully",
      ticket: newTicket,
    });
  } catch (error: unknown) {
    console.error("Support POST API Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create support ticket";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
