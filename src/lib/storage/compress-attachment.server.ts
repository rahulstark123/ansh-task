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

export type UploadFolder = "attachments" | "profiles" | "tickets";

export type CompressionTarget = {
  /** Maximum output size in bytes. */
  maxBytes: number;
  /** Longest edge (px) the image is scaled down to before compressing. */
  maxDimension: number;
};

/** Per-folder compression targets. Every upload is compressed to one of these. */
export const COMPRESSION_TARGETS: Record<UploadFolder, CompressionTarget> = {
  attachments: { maxBytes: TASK_MAX_ATTACHMENT_BYTES, maxDimension: 1920 },
  tickets: { maxBytes: TASK_MAX_ATTACHMENT_BYTES, maxDimension: 1920 },
  profiles: { maxBytes: 500 * 1024, maxDimension: 512 },
};

export function compressionTargetForFolder(folder: string): CompressionTarget {
  return COMPRESSION_TARGETS[folder as UploadFolder] ?? COMPRESSION_TARGETS.attachments;
}

function isImageMime(mimeType: string, fileName: string): boolean {
  const mime = mimeType.toLowerCase();
  if (IMAGE_MIME_TYPES.has(mime)) return true;
  return /\.(jpe?g|png|webp|gif|bmp|avif|tiff?)$/i.test(fileName);
}

function replaceExtension(fileName: string, extension: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return `${base || "attachment"}.${extension}`;
}

/**
 * Server-side compression for uploads (sharp, Apache-2.0). Every upload flows
 * through here so nothing reaches storage uncompressed. Non-image files are only
 * size-checked (they cannot be re-encoded), while images are always resized and
 * re-encoded down to the folder's target size.
 */
export async function compressUploadBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  target: CompressionTarget = COMPRESSION_TARGETS.attachments
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  const { maxBytes, maxDimension } = target;

  if (!isImageMime(mimeType, fileName)) {
    if (buffer.length > maxBytes) {
      throw new Error(
        `File must be ${formatTaskAttachmentSize(maxBytes)} or less (received: ${formatTaskAttachmentSize(buffer.length)}).`
      );
    }
    return { buffer, contentType: mimeType || "application/octet-stream", fileName };
  }

  let pipeline = sharp(buffer, { animated: true }).rotate();
  const metadata = await pipeline.metadata();

  if (metadata.width && metadata.width > maxDimension) {
    pipeline = pipeline.resize(maxDimension, undefined, {
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

    if (output.length <= maxBytes) {
      return {
        buffer: output,
        contentType: hasAlpha ? "image/webp" : "image/jpeg",
        fileName: replaceExtension(fileName, hasAlpha ? "webp" : "jpg"),
      };
    }

    quality -= 12;
  }

  const fallbackDimension = Math.max(1, Math.round(maxDimension * (2 / 3)));
  const fallback = await pipeline
    .resize(fallbackDimension, undefined, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 60, effort: 4 })
    .toBuffer();

  if (fallback.length <= maxBytes) {
    return {
      buffer: fallback,
      contentType: "image/webp",
      fileName: replaceExtension(fileName, "webp"),
    };
  }

  throw new Error(
    `Image is still ${formatTaskAttachmentSize(fallback.length)} after compression. Max allowed is ${formatTaskAttachmentSize(maxBytes)}.`
  );
}
