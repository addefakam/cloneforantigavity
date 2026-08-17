import { NextResponse } from "next/server";
import { ensureNewTables } from "@/lib/ensure-tables";

/** Manual trigger for table setup. Also called automatically by new-feature APIs. */
export async function POST() {
  try {
    await ensureNewTables();
    return NextResponse.json({ ok: true, msg: "Tables verified/created" });
  } catch (error) {
    console.error("[setup] Error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
