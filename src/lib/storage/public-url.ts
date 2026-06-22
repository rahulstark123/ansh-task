const PRIVATE_R2_HOST = "r2.cloudflarestorage.com";
const R2_PUBLIC_HOST_SUFFIX = ".r2.dev";

function getBucketName(): string {
  return process.env.S3_BUCKET_NAME || "anshapps-storage";
}

function getStoragePrefix(): string {
  return (process.env.S3_STORAGE_PREFIX ?? "tasks").replace(/^\/+|\/+$/g, "");
}

/** True when the URL is the private R2 S3 API endpoint (not browser-safe). */
export function isPrivateR2ApiBaseUrl(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).hostname.endsWith(PRIVATE_R2_HOST);
  } catch {
    return false;
  }
}

export function buildStorageProxyUrl(key: string): string {
  return `/api/storage/object?key=${encodeURIComponent(key)}`;
}

function normalizeKeyForPublicBase(publicBase: string, key: string): string {
  const normalizedKey = key.replace(/^\/+/, "");
  const storagePrefix = getStoragePrefix();
  const base = publicBase.replace(/\/$/, "");

  // Prevent .../tasks/tasks/... when S3_PUBLIC_BASE_URL already ends with /tasks.
  if (
    storagePrefix &&
    base.endsWith(`/${storagePrefix}`) &&
    normalizedKey.startsWith(`${storagePrefix}/`)
  ) {
    return normalizedKey.slice(storagePrefix.length + 1);
  }

  return normalizedKey;
}

function objectKeyFromPublicPath(pathname: string): string {
  let path = pathname.replace(/^\/+/, "");
  const storagePrefix = getStoragePrefix();
  const duplicatePrefix = `${storagePrefix}/${storagePrefix}/`;

  if (path.startsWith(duplicatePrefix)) {
    path = path.slice(storagePrefix.length + 1);
  }

  return path;
}

/** Build a browser-safe URL for a stored object key. */
export function getPublicObjectUrl(key: string): string {
  const publicBase = process.env.S3_PUBLIC_BASE_URL?.trim();

  if (publicBase && !isPrivateR2ApiBaseUrl(publicBase)) {
    const normalizedKey = normalizeKeyForPublicBase(publicBase, key);
    return `${publicBase.replace(/\/$/, "")}/${normalizedKey}`;
  }

  return buildStorageProxyUrl(key.replace(/^\/+/, ""));
}

/** Rewrite stored URLs to a working browser URL (proxy or fixed public path). */
export function resolveStorageUrl(url: string): string {
  if (!url || url.startsWith("data:") || url.startsWith("/api/storage/object")) {
    return url;
  }

  try {
    const parsed = new URL(url);

    if (parsed.hostname.endsWith(PRIVATE_R2_HOST)) {
      let key = parsed.pathname.replace(/^\/+/, "");
      const bucket = getBucketName();
      if (key.startsWith(`${bucket}/`)) {
        key = key.slice(bucket.length + 1);
      }
      return buildStorageProxyUrl(key);
    }

    if (parsed.hostname.endsWith(R2_PUBLIC_HOST_SUFFIX)) {
      const key = objectKeyFromPublicPath(parsed.pathname);
      if (key.startsWith(`${getStoragePrefix()}/`)) {
        return getPublicObjectUrl(key);
      }
      return buildStorageProxyUrl(key);
    }

    return url;
  } catch {
    return url;
  }
}
