import { NextResponse } from "next/server";
import {
  COMPRESSION_TARGETS,
  compressUploadBuffer,
} from "@/lib/storage/compress-attachment.server";
import {
  buildSharedStorageKey,
  buildWorkspaceStorageKey,
  sanitizeStorageSegment,
  uploadToR2,
} from "@/lib/storage/r2";

export const dynamic = "force-dynamic";

const MAX_AVATAR_INPUT_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const email = formData.get("email") as string | null;
    const workspaceIdParam = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_INPUT_BYTES) {
      return NextResponse.json(
        { success: false, error: "Avatar image is too large to process." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const compressed = await compressUploadBuffer(
      Buffer.from(bytes),
      file.type || "image/jpeg",
      file.name,
      COMPRESSION_TARGETS.profiles
    );
    const buffer = compressed.buffer;
    const sanitizedFileName = sanitizeStorageSegment(compressed.fileName) || "avatar";
    const sanitizedEmail = sanitizeStorageSegment(email);
    const objectName = `${sanitizedEmail}-${Date.now()}-${sanitizedFileName}`;

    const workspaceId = workspaceIdParam
      ? Number.parseInt(workspaceIdParam, 10)
      : NaN;

    const key =
      Number.isFinite(workspaceId) && workspaceId > 0
        ? buildWorkspaceStorageKey(workspaceId, "profiles", objectName)
        : buildSharedStorageKey("profiles", objectName);

    const { url } = await uploadToR2({
      key,
      body: buffer,
      contentType: compressed.contentType,
    });

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error: unknown) {
    console.error("Avatar upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload avatar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
