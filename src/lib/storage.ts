/**
 * File Storage Abstraction Layer
 * 
 * Currently stores files as base64 in the database (PostgreSQL TEXT columns).
 * To migrate to S3 or blob storage later, swap the implementation in each function below.
 * 
 * All file uploads (licenseFile, room images, logos) should go through
 * this module instead of storing base64 directly in the database.
 */

// Storage URL prefix to detect URL-stored files vs base64 (DB-stored)
export const BLOB_PREFIX = "https://";

/**
 * Check if a file reference is a URL (remote-stored) vs base64 (DB-stored)
 */
export function isBlobUrl(fileRef: string | null | undefined): boolean {
  if (!fileRef) return false;
  return fileRef.startsWith(BLOB_PREFIX);
}

/**
 * Upload a file — currently stores as base64 data URI in the database.
 * Accepts a base64 data URI string (e.g., "data:image/jpeg;base64,...")
 * Returns the base64 data URI string.
 * 
 * Future: swap this to upload to S3/blob and return the URL instead.
 */
export async function uploadFile(
  base64DataUri: string,
  _prefix: string = "uploads"
): Promise<string> {
  // Validate the data URI format
  const matches = base64DataUri.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 data URI format");
  }
  // Currently just returns the base64 — no external storage needed
  return base64DataUri;
}

/**
 * Delete a file from storage.
 * Safe to call with base64 strings — will be a no-op.
 */
export async function deleteFile(_fileUrl: string): Promise<void> {
  // No-op for base64 storage (data lives in DB rows, deleted with the row)
}

/**
 * Migrate a legacy base64 file reference to external storage.
 * Currently a no-op since we store base64 directly.
 * Returns the original value.
 */
export async function migrateBase64ToBlob(
  fileRef: string,
  _prefix: string = "uploads"
): Promise<string> {
  return fileRef;
}
