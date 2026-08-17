import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext, getProviderFilter, AuthError } from "@/lib/tenant";

async function ensureTables() {
  try { await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/setup`, { method: "POST" }); } catch {}
}

export async function GET(req: NextRequest) {
  try {
    await ensureTables();
    const auth = await getAuthContext(req);
    const filter = getProviderFilter(auth);

    const where: Record<string, unknown> = filter.isPolice
      ? {}
      : { providerId: filter.providerId };

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status") || "";
    const channel = searchParams.get("channel") || "";

    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [data, total] = await Promise.all([
      db.messageLog.findMany({
        where,
        include: {
          template: { select: { id: true, name: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.messageLog.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[messages/logs GET]", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("does not exist") || msg.includes("Unknown table") || msg.includes("relation")) {
      return NextResponse.json({ data: [], total: 0, page: 1, limit: 50, totalPages: 0 });
    }
    return NextResponse.json({ error: "Failed to fetch message logs" }, { status: 500 });
  }
}
