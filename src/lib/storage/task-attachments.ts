export const TASK_MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export function formatTaskAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function taskAttachmentSizeError(bytes: number): string {
  return `File must be 2 MB or less (selected: ${formatTaskAttachmentSize(bytes)}).`;
}
