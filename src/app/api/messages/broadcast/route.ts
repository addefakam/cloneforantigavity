import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext, AuthError } from "@/lib/tenant";
import { ensureNewTables } from "@/lib/ensure-tables";

/**
 * Get list of approved providers with contact info for broadcast targeting.
 * Used by police/admin to select which providers to notify.
 */
export async function GET(req: NextRequest) {
  try {
    await ensureNewTables();
    const auth = await getAuthContext(req);

    // Only POLICE and SUPERUSER can view provider contact list for broadcasts
    if (auth.role !== "POLICE" && auth.role !== "SUPERUSER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const providers = await db.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        ownerName: string;
        phone: string;
        email: string;
        address: string;
        type: string;
        status: string;
        telegramChatId: string | null;
        _count: { rooms: number; guests: number; users: number };
      }>
    >(`
      SELECT 
        p.id, p.name, p."ownerName", p.phone, p.email, p.address, p.type, p.status,
        COALESCE(p."telegramChatId", '') as "telegramChatId",
        (SELECT COUNT(*)::int FROM "Room" r WHERE r."providerId" = p.id) as room_count,
        (SELECT COUNT(*)::int FROM "Guest" g WHERE g."providerId" = p.id) as guest_count,
        (SELECT COUNT(*)::int FROM "User" u WHERE u."providerId" = p.id AND u."isActive" = true) as user_count
      FROM "Provider" p
      WHERE p.status = 'APPROVED'
      ORDER BY p.name ASC
    `);

    // Format the response
    const formatted = providers.map((p) => ({
      id: p.id,
      name: p.name,
      ownerName: p.ownerName,
      phone: p.phone,
      email: p.email,
      address: p.address,
      type: p.type,
      status: p.status,
      telegramChatId: p.telegramChatId,
      hasPhone: !!p.phone,
      hasTelegram: !!p.telegramChatId,
      roomCount: p.room_count,
      guestCount: p.guest_count,
      userCount: p.user_count,
    }));

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[messages/broadcast GET]", error);
    return NextResponse.json({ error: "Failed to fetch providers for broadcast" }, { status: 500 });
  }
}
