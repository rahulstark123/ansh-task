import {
  TASK_MAX_ATTACHMENT_BYTES,
  taskAttachmentSizeError,
} from "@/lib/storage/task-attachments";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif",
]);

function isImageFile(file: File): boolean {
  return IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name);
}

export type ClientCompressTarget = {
  /** Maximum output size in bytes. */
  maxBytes: number;
  /** Longest edge (px) the image is scaled down to. */
  maxDimension: number;
};

/** Client-side targets, mirroring the authoritative server-side ones. */
export const CLIENT_COMPRESSION_TARGETS = {
  attachments: { maxBytes: TASK_MAX_ATTACHMENT_BYTES, maxDimension: 1920 },
  tickets: { maxBytes: TASK_MAX_ATTACHMENT_BYTES, maxDimension: 1920 },
  profiles: { maxBytes: 500 * 1024, maxDimension: 512 },
} satisfies Record<string, ClientCompressTarget>;

export function clientCompressionTarget(folder: string): ClientCompressTarget {
  return (
    (CLIENT_COMPRESSION_TARGETS as Record<string, ClientCompressTarget>)[folder] ??
    CLIENT_COMPRESSION_TARGETS.attachments
  );
}

/**
 * Client-side compression for uploads (browser-image-compression, MIT).
 *
 * This is a best-effort bandwidth optimization only: the upload route always
 * re-compresses with sharp and enforces the size limit server-side. So if the
 * browser pass fails (e.g. some environments transfer the image as a
 * SharedArrayBuffer to the worker, which the library rejects), we fall back to
 * the original file and let the server handle it instead of blocking the upload.
 */
export async function compressImageForUpload(
  file: File,
  target: ClientCompressTarget = CLIENT_COMPRESSION_TARGETS.attachments
): Promise<File> {
  if (!isImageFile(file)) {
    if (file.size > target.maxBytes) {
      throw new Error(taskAttachmentSizeError(file.size));
    }
    return file;
  }

  let imageCompression: typeof import("browser-image-compression").default;
  try {
    imageCompression = (await import("browser-image-compression")).default;
  } catch {
    return file;
  }

  let quality = 0.82;
  let compressed = file;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      compressed = await imageCompression(file, {
        maxSizeMB: target.maxBytes / (1024 * 1024),
        maxWidthOrHeight: target.maxDimension,
        // Run on the main thread: the web-worker path transfers the image's
        // backing buffer via postMessage, which can surface as a
        // SharedArrayBuffer and crash the library's decode step.
        useWebWorker: false,
        initialQuality: quality,
        alwaysKeepResolution: false,
      });
    } catch {
      return file;
    }

    if (compressed.size <= target.maxBytes) {
      return compressed;
    }

    quality -= 0.15;
    if (quality < 0.35) break;
  }

  return compressed.size < file.size ? compressed : file;
}
