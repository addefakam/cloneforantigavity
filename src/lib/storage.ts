/**
 * File Storage Abstraction Layer
 * 
 * Currently uses Vercel Blob. To migrate to S3 (Ethio Telecom AWS),
 * swap the implementation in each function below — no other code changes needed.
 * 
 * All file uploads (licenseFile, room images, logos) should go through
 * this module instead of storing base64 directly in the database.
 */

// Storage URL prefix to detect blob-stored files vs legacy base64
export const BLOB_PREFIX = "https://";

/**
 * Check if a file reference is a URL (blob-stored) vs base64 (legacy DB-stored)
 */
export function isBlobUrl(fileRef: string | null | undefined): boolean {
  if (!fileRef) return false;
  return fileRef.startsWith(BLOB_PREFIX);
}

/**
 * Dynamically import @vercel/blob using a non-analyzable pattern
 * so bundlers (Webpack/Turbopack) don't try to resolve it at build time.
 * Falls back to base64 if the package is unavailable.
 */
async function getBlobModule(): Promise<{ put: Function; del: Function } | null> {
  try {
    // Use string concatenation to prevent static analysis from resolving the module
    const mod = await import("@vercel" + "/blob");
    return mod as unknown as { put: Function; del: Function };
  } catch {
    return null;
  }
}

/**
 * Upload a file to blob storage.
 * Accepts a base64 data URI string (e.g., "data:image/jpeg;base64,...")
 * Returns the blob URL string, or the original base64 if blob is unavailable.
 */
export async function uploadFile(
  base64DataUri: string,
  prefix: string = "uploads"
): Promise<string> {
  // Parse the data URI
  const matches = base64DataUri.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 data URI format");
  }

  const mimeType = matches[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, "base64");

  // Determine extension from mime type
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  const ext = extMap[mimeType] || "bin";

  const filename = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await getBlobModule();
  if (blob) {
    const result = await blob.put(filename, buffer, {
      contentType: mimeType,
      access: "public",
    });
    return (result as { url: string }).url;
  }

  // Fallback: store base64 in DB (legacy behavior)
  console.warn("[storage] @vercel/blob not available, using base64 fallback");
  return base64DataUri;
}

/**
 * Delete a file from blob storage.
 * Safe to call with base64 strings — will be a no-op.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  if (!isBlobUrl(fileUrl)) return; // Legacy base64, nothing to delete

  const blob = await getBlobModule();
  if (blob) {
    try {
      await blob.del(fileUrl);
    } catch (error) {
      console.warn("[storage] Failed to delete blob:", error);
    }
  }
}

/**
 * Migrate a legacy base64 file reference to blob storage.
 * Returns the new URL (or original if already a URL or migration fails).
 */
export async function migrateBase64ToBlob(
  base64DataUri: string,
  prefix: string = "uploads"
): Promise<string> {
  if (isBlobUrl(base64DataUri)) return base64DataUri;
  return uploadFile(base64DataUri, prefix);
}
