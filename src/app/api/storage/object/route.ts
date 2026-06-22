import { NextResponse } from "next/server";
import { contentDispositionForObject } from "@/lib/storage/attachments";
import { fetchR2Object } from "@/lib/storage/r2";

export const dynamic = "force-dynamic";

function isValidObjectKey(key: string): boolean {
  if (!key || key.includes("..") || key.startsWith("/")) {
    return false;
  }
  return key.startsWith("tasks/");
}

function fileNameFromKey(key: string): string {
  const segment = key.split("/").pop() ?? "file";
  return segment.replace(/[^\w.\-()+ ]/g, "_");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const key = requestUrl.searchParams.get("key")?.trim();
  const forceDownload = requestUrl.searchParams.get("download") === "1";

  if (!key || !isValidObjectKey(key)) {
    return NextResponse.json({ error: "Invalid object key" }, { status: 400 });
  }

  try {
    const object = await fetchR2Object(key);
    const disposition = forceDownload
      ? "attachment"
      : contentDispositionForObject(object.contentType, key);
    const fileName = fileNameFromKey(key);

    return new Response(Buffer.from(object.body), {
      status: 200,
      headers: {
        "Content-Type": object.contentType,
        "Content-Length": String(object.body.byteLength),
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    console.error("R2 object fetch error:", error);
    return NextResponse.json({ error: "Object not found" }, { status: 404 });
  }
}
