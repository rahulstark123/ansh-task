import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

// Initialize S3 Client
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const email = formData.get("email") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // Server-side size validation (< 500KB)
    if (file.size > 500 * 1024) {
      return NextResponse.json({ success: false, error: "File size exceeds 500KB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedFileName = file.name.replace(/\s+/g, "_");
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
    const key = `profiles/${sanitizedEmail}-${Date.now()}-${sanitizedFileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || "anshtasks",
        Key: key,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      })
    );

    // Supabase public storage url
    const publicUrl = `https://runubzqcrytlvyflunba.supabase.co/storage/v1/object/public/${process.env.S3_BUCKET_NAME || "anshtasks"}/${key}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
