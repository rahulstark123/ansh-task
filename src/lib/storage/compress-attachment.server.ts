import sharp from "sharp";
import {
  TASK_MAX_ATTACHMENT_BYTES,
  formatTaskAttachmentSize,
} from "@/lib/storage/task-attachments";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif",
  "image/tiff",
]);

function isImageMime(mimeType: string, fileName: string): boolean {
  const mime = mimeType.toLowerCase();
  if (IMAGE_MIME_TYPES.has(mime)) return true;
  return /\.(jpe?g|png|webp|gif|bmp|avif|tiff?)$/i.test(fileName);
}

function replaceExtension(fileName: string, extension: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return `${base || "attachment"}.${extension}`;
}

/** Server-side compression for task attachments (sharp, Apache-2.0). */
export async function compressTaskAttachmentBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  if (!isImageMime(mimeType, fileName)) {
    if (buffer.length > TASK_MAX_ATTACHMENT_BYTES) {
      throw new Error(
        `File must be 2 MB or less (received: ${formatTaskAttachmentSize(buffer.length)}).`
      );
    }
    return { buffer, contentType: mimeType || "application/octet-stream", fileName };
  }

  let pipeline = sharp(buffer, { animated: true }).rotate();
  const metadata = await pipeline.metadata();

  if (metadata.width && metadata.width > 1920) {
    pipeline = pipeline.resize(1920, undefined, {
      withoutEnlargement: true,
      fit: "inside",
    });
  }

  const hasAlpha = metadata.hasAlpha;
  let quality = 82;

  while (quality >= 45) {
    const output = hasAlpha
      ? await pipeline.clone().webp({ quality, effort: 4 }).toBuffer()
      : await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();

    if (output.length <= TASK_MAX_ATTACHMENT_BYTES) {
      return {
        buffer: output,
        contentType: hasAlpha ? "image/webp" : "image/jpeg",
        fileName: replaceExtension(fileName, hasAlpha ? "webp" : "jpg"),
      };
    }

    quality -= 12;
  }

  const fallback = await pipeline
    .resize(1280, undefined, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 60, effort: 4 })
    .toBuffer();

  if (fallback.length <= TASK_MAX_ATTACHMENT_BYTES) {
    return {
      buffer: fallback,
      contentType: "image/webp",
      fileName: replaceExtension(fileName, "webp"),
    };
  }

  throw new Error(
    `Image is still ${formatTaskAttachmentSize(fallback.length)} after compression. Max allowed is 2 MB.`
  );
}
