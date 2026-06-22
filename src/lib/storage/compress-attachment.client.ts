import {
  TASK_MAX_ATTACHMENT_BYTES,
  formatTaskAttachmentSize,
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

/** Client-side compression for task attachments (browser-image-compression, MIT). */
export async function compressTaskAttachmentFile(file: File): Promise<File> {
  if (isImageFile(file)) {
    const imageCompression = (await import("browser-image-compression")).default;
    let quality = 0.82;
    let compressed = file;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      compressed = await imageCompression(file, {
        maxSizeMB: TASK_MAX_ATTACHMENT_BYTES / (1024 * 1024),
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality,
        alwaysKeepResolution: false,
      });

      if (compressed.size <= TASK_MAX_ATTACHMENT_BYTES) {
        return compressed;
      }

      quality -= 0.15;
      if (quality < 0.35) break;
    }

    throw new Error(
      `Image is still ${formatTaskAttachmentSize(compressed.size)} after compression. Please use a smaller image (max 2 MB).`
    );
  }

  if (file.size > TASK_MAX_ATTACHMENT_BYTES) {
    throw new Error(taskAttachmentSizeError(file.size));
  }

  return file;
}
