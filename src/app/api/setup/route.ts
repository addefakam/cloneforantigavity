import { NextRequest, NextResponse } from "next/server";
import { ensureNewTables } from "@/lib/ensure-tables";
import { requireAdminAccess } from "@/lib/admin-guard";

/**
 * Manual trigger for table setup.
 * Deploy-blocker fix: requires admin secret header OR authenticated SUPERUSER.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminAccess(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    await ensureNewTables();
    return NextResponse.json({ ok: true, msg: "Tables verified/created" });
  } catch (error) {
    console.error("[setup] Error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
