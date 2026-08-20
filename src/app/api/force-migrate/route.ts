import { NextRequest, NextResponse } from "next/server";
import { forceMigrate } from "@/lib/init-db";
import { requireAdminAccess } from "@/lib/admin-guard";

export const maxDuration = 60;

// POST /api/force-migrate — Force-run all idempotent migrations on the live DB
// Deploy-blocker fix: requires admin secret header OR authenticated SUPERUSER.
export async function POST(req: NextRequest) {
  const guard = await requireAdminAccess(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    await forceMigrate();
    return NextResponse.json({ success: true, message: "All migrations applied successfully." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
