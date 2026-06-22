const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?.*)?$/i;
const PDF_EXT = /\.pdf(\?.*)?$/i;

function storageKeyFromUrl(url: string): string {
  if (!url.includes("/api/storage/object")) return "";
  try {
    const parsed = new URL(url, "http://localhost");
    const key = parsed.searchParams.get("key");
    return key ? decodeURIComponent(key) : "";
  } catch {
    return "";
  }
}

export function isImageStorageFile(url: string, fileName?: string): boolean {
  const key = storageKeyFromUrl(url);
  const haystack = `${fileName ?? ""} ${url} ${key}`;
  return IMAGE_EXT.test(haystack) || /^data:image\//i.test(url);
}

export function isPdfStorageFile(url: string, fileName?: string): boolean {
  const key = storageKeyFromUrl(url);
  const haystack = `${fileName ?? ""} ${url} ${key}`;
  return PDF_EXT.test(haystack) || /^data:application\/pdf/i.test(url);
}

export function canPreviewStorageFile(url: string, fileName?: string): boolean {
  return isImageStorageFile(url, fileName) || isPdfStorageFile(url, fileName);
}

function withDownloadParam(url: string): string {
  return url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
}

/** Open file in a new browser tab for preview. */
export function previewStorageFile(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Download file to the user's device. */
export async function downloadStorageFile(
  url: string,
  fileName: string
): Promise<void> {
  const downloadUrl = withDownloadParam(url);
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error("Failed to download file");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export function contentDispositionForObject(
  contentType: string,
  key: string
): "inline" | "attachment" {
  const lowerType = contentType.toLowerCase();
  if (lowerType.startsWith("image/") || lowerType === "application/pdf") {
    return "inline";
  }

  const fileName = key.split("/").pop() ?? "";
  if (isImageStorageFile(fileName) || isPdfStorageFile(fileName)) {
    return "inline";
  }

  return "attachment";
}
