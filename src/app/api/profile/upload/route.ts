import { NextResponse } from "next/server";
import {
  buildSharedStorageKey,
  buildWorkspaceStorageKey,
  sanitizeStorageSegment,
  uploadToR2,
} from "@/lib/storage/r2";

export const dynamic = "force-dynamic";

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

    if (file.size > 500 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 500KB limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedFileName = sanitizeStorageSegment(file.name) || "avatar";
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
      contentType: file.type || "image/jpeg",
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
