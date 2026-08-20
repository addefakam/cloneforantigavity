/**
 * DEPRECATED — all table creation is now unified in init-db.ts.
 * This file is kept as a safe no-op to avoid breaking existing imports.
 * The dangerous DROP TABLE on NotificationBroadcast has been REMOVED.
 */
import { ensureDatabase } from "./init-db";

let setupDone = false;
let setupPromise: Promise<void> | null = null;

export async function ensureNewTables(): Promise<void> {
  if (setupDone) return;
  if (setupPromise) { await setupPromise; return; }

  setupPromise = (async () => {
    try {
      await ensureDatabase();
    } catch (err) {
      console.error("[ensureNewTables] Error:", err);
    } finally {
      setupDone = true;
    }
  })();

  await setupPromise;
}
