import { compressTaskAttachmentFile } from "@/lib/storage/compress-attachment.client";
import {
  TASK_MAX_ATTACHMENT_BYTES,
  taskAttachmentSizeError,
} from "@/lib/storage/task-attachments";

export type StorageFolder = "attachments" | "profiles" | "tickets";

export async function uploadFileToStorage(
  file: File,
  params: {
    workspaceId: number;
    folder: StorageFolder;
    prefix?: string;
  }
): Promise<{ url: string; name: string; size: number }> {
  let fileToUpload = file;

  if (params.folder === "attachments") {
    if (file.size > TASK_MAX_ATTACHMENT_BYTES * 4) {
      throw new Error(
        `${taskAttachmentSizeError(file.size)} Very large files cannot be compressed enough.`
      );
    }
    fileToUpload = await compressTaskAttachmentFile(file);
  }

  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("workspaceId", String(params.workspaceId));
  formData.append("folder", params.folder);
  if (params.prefix) {
    formData.append("prefix", params.prefix);
  }

  const res = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });
  const json = await res.json();

  if (!res.ok || !json.success || !json.url) {
    throw new Error(json.error || "Failed to upload file");
  }

  return {
    url: json.url,
    name: file.name,
    size: fileToUpload.size,
  };
}
