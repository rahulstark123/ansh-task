import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getPublicObjectUrl } from "@/lib/storage/public-url";

export { getPublicObjectUrl, resolveStorageUrl } from "@/lib/storage/public-url";

const STORAGE_PREFIX = (process.env.S3_STORAGE_PREFIX ?? "tasks").replace(
  /^\/+|\/+$/g,
  ""
);

let s3Client: S3Client | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: requireEnv("S3_ENDPOINT"),
      region: process.env.S3_REGION || "auto",
      credentials: {
        accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

function getBucketName(): string {
  return process.env.S3_BUCKET_NAME || "anshapps-storage";
}

/** Safe path segment for object keys. */
export function sanitizeStorageSegment(segment: string): string {
  return segment
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** `tasks/{workspaceId}/...` — workspace-scoped folders inside the bucket. */
export function buildWorkspaceStorageKey(
  workspaceId: number | string,
  ...pathSegments: string[]
): string {
  const wid = sanitizeStorageSegment(String(workspaceId));
  const rest = pathSegments.map(sanitizeStorageSegment).filter(Boolean).join("/");
  return rest ? `${STORAGE_PREFIX}/${wid}/${rest}` : `${STORAGE_PREFIX}/${wid}`;
}

/** `tasks/shared/...` — assets not tied to a workspace (fallback profiles, etc.). */
export function buildSharedStorageKey(...pathSegments: string[]): string {
  const rest = pathSegments.map(sanitizeStorageSegment).filter(Boolean).join("/");
  return `${STORAGE_PREFIX}/shared/${rest}`;
}

export async function fetchR2Object(key: string): Promise<{
  body: Uint8Array;
  contentType: string;
}> {
  const result = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );

  if (!result.Body) {
    throw new Error("Object body is empty");
  }

  const body = await result.Body.transformToByteArray();

  return {
    body,
    contentType: result.ContentType || "application/octet-stream",
  };
}

/**
 * Copy file bytes into a Node Buffer that owns a plain ArrayBuffer.
 * Next/undici can surface upload bytes as SharedArrayBuffer; AWS SDK's
 * @smithy/util-buffer-from rejects those with:
 * `The "input" argument must be ArrayBuffer. Received type object ([object SharedArrayBuffer])`.
 */
export function bufferFromArrayBufferLike(
  bytes: ArrayBuffer | SharedArrayBuffer | ArrayBufferView
): Buffer {
  const view = ArrayBuffer.isView(bytes)
    ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    : new Uint8Array(bytes);
  // Buffer.from(Uint8Array) copies, so the result never views a SharedArrayBuffer.
  return Buffer.from(view);
}

/** Ensure PutObject Body is never SharedArrayBuffer-backed. */
function toAwsSafeBuffer(body: Buffer): Buffer {
  if (
    typeof SharedArrayBuffer !== "undefined" &&
    body.buffer instanceof SharedArrayBuffer
  ) {
    return Buffer.from(body);
  }
  return body;
}

export async function uploadToR2(options: {
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<{ key: string; url: string }> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: options.key,
      Body: toAwsSafeBuffer(options.body),
      ContentType: options.contentType || "application/octet-stream",
    })
  );

  return {
    key: options.key,
    url: getPublicObjectUrl(options.key),
  };
}
