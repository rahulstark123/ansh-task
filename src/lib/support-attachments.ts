export const SUPPORT_MAX_IMAGES = 5;
export const SUPPORT_MAX_TOTAL_BYTES = 10 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export function isSupportImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (IMAGE_MIME_TYPES.has(type)) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

export function formatSupportAttachmentSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateSupportAttachments(
  files: File[]
): { ok: true } | { ok: false; error: string } {
  const valid = files.filter((f) => f.size > 0);

  if (valid.length > SUPPORT_MAX_IMAGES) {
    return {
      ok: false,
      error: `You can attach up to ${SUPPORT_MAX_IMAGES} images per ticket.`,
    };
  }

  for (const file of valid) {
    if (!isSupportImageFile(file)) {
      return {
        ok: false,
        error: `"${file.name}" is not a supported image. Use PNG, JPG, WEBP, or GIF.`,
      };
    }
  }

  const totalBytes = valid.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > SUPPORT_MAX_TOTAL_BYTES) {
    return {
      ok: false,
      error: `Total attachment size must be under 10 MB (selected: ${formatSupportAttachmentSize(totalBytes)}).`,
    };
  }

  return { ok: true };
}
