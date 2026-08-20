/**
 * Admin-secret guard for dangerous endpoints (setup-db, force-migrate, setup).
 *
 * Two layers of protection:
 *   1. Secret header check:  X-Admin-Secret must match ADMIN_SECRET env var
 *   2. Authenticated SUPERUSER check via getAuthContext()
 *
 * At least ONE must pass. This lets you:
 *   - Use the header from CI/scripts (no session needed)
 *   - Use the dashboard UI (superuser session, no header needed)
 *
 * If ADMIN_SECRET is not set, ONLY superuser auth is accepted.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, AuthError } from "@/lib/tenant";

const HEADER_NAME = "x-admin-secret";

function getAdminSecret(): string | undefined {
  return process.env.ADMIN_SECRET;
}

export type GuardResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Check if the request carries a valid admin secret header.
 * Returns true if ADMIN_SECRET is configured AND the header matches.
 */
function checkSecretHeader(req: NextRequest): boolean {
  const expected = getAdminSecret();
  if (!expected) return false; // secret not configured → header auth not available
  const provided = req.headers.get(HEADER_NAME);
  if (!provided) return false;
  // Constant-time comparison to prevent timing attacks
  try {
    const encoder = new TextEncoder();
    const a = encoder.encode(expected);
    const b = encoder.encode(provided);
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}

/**
 * Guard a dangerous admin endpoint.
 *
 * Usage:
 *   const guard = await requireAdminAccess(req);
 *   if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
 */
export async function requireAdminAccess(req: NextRequest): Promise<GuardResult> {
  // Layer 1: secret header
  if (checkSecretHeader(req)) {
    return { ok: true };
  }

  // Layer 2: authenticated SUPERUSER
  try {
    const auth = await getAuthContext(req);
    if (auth.role === "SUPERUSER") {
      return { ok: true };
    }
    return { ok: false, status: 403, error: "Superuser access required." };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, status: error.statusCode, error: error.message };
    }
    return { ok: false, status: 401, error: "Authentication required." };
  }
}
