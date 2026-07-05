import {
  clientCompressionTarget,
  compressImageForUpload,
} from "@/lib/storage/compress-attachment.client";

export type StorageFolder = "attachments" | "profiles" | "tickets";

export async function uploadFileToStorage(
  file: File,
  params: {
    workspaceId: number;
    folder: StorageFolder;
    prefix?: string;
  }
): Promise<{ url: string; name: string; size: number }> {
  const fileToUpload = await compressImageForUpload(
    file,
    clientCompressionTarget(params.folder)
  );

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
    // Prefer the server-reported size: it reflects the final, sharp-compressed
    // bytes actually stored, not the lighter client-side pass.
    size: typeof json.size === "number" ? json.size : fileToUpload.size,
  };
}
