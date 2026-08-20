/**
 * DEPRECATED — all migrations are now unified in init-db.ts.
 * This file is kept as a safe no-op to avoid breaking existing imports.
 */
import { ensureDatabase } from "./init-db";

let _inlineDone = false;
let _inlinePromise: Promise<void> | null = null;

export async function ensureInlineMigrations(): Promise<void> {
  if (_inlineDone) return;
  if (_inlinePromise) return _inlinePromise;

  _inlinePromise = (async () => {
    try {
      await ensureDatabase();
      _inlineDone = true;
    } catch (err) {
      console.error("[inline-migrate] Failed:", err instanceof Error ? err.message : String(err));
      _inlinePromise = null; // Allow retry
    }
  })();

  return _inlinePromise;
}
