import { NextResponse } from "next/server";
import { compressTaskAttachmentBuffer } from "@/lib/storage/compress-attachment.server";
import {
  buildWorkspaceStorageKey,
  sanitizeStorageSegment,
  uploadToR2,
} from "@/lib/storage/r2";
import { TASK_MAX_ATTACHMENT_BYTES } from "@/lib/storage/task-attachments";

export const dynamic = "force-dynamic";

const ALLOWED_FOLDERS = new Set(["attachments", "profiles", "tickets"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const workspaceIdParam = formData.get("workspaceId") as string | null;
    const folder = (formData.get("folder") as string | null)?.trim() || "attachments";
    const prefix = (formData.get("prefix") as string | null)?.trim();

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!workspaceIdParam) {
      return NextResponse.json(
        { success: false, error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { success: false, error: "Invalid storage folder" },
        { status: 400 }
      );
    }

    const workspaceId = Number.parseInt(workspaceIdParam, 10);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    if (folder === "profiles" && file.size > 500 * 1024) {
      return NextResponse.json(
        { success: false, error: "Profile image must be under 500 KB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(bytes);
    let contentType = file.type || "application/octet-stream";
    let fileName = sanitizeStorageSegment(file.name) || "file";

    if (folder === "attachments") {
      const compressed = await compressTaskAttachmentBuffer(
        buffer,
        contentType,
        file.name
      );
      buffer = compressed.buffer;
      contentType = compressed.contentType;
      fileName = sanitizeStorageSegment(compressed.fileName) || fileName;

      if (buffer.length > TASK_MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { success: false, error: "File must be 2 MB or less after compression." },
          { status: 400 }
        );
      }
    }

    const namePrefix = prefix ? sanitizeStorageSegment(prefix) : String(Date.now());

    const key = buildWorkspaceStorageKey(
      workspaceId,
      folder,
      `${namePrefix}-${fileName}`
    );

    const { url } = await uploadToR2({
      key,
      body: buffer,
      contentType,
    });

    return NextResponse.json({
      success: true,
      url,
      key,
      size: buffer.length,
    });
  } catch (error: unknown) {
    console.error("Storage upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
