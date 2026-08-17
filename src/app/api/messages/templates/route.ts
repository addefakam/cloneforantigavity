import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext, getProviderFilter, AuthError } from "@/lib/tenant";
import { logStaffActivity, getLogUserInfo } from "@/lib/staff-log";
import { ensureNewTables } from "@/lib/ensure-tables";

// Default templates to seed on first access
const DEFAULT_TEMPLATES = [
  {
    name: "Check-in Reminder",
    type: "CHECKIN_REMINDER",
    channel: "SMS" as const,
    body: "Dear {{guestName}}, this is a reminder that your reservation at {{guestHouseName}} is confirmed. Room {{roomNumber}} for {{nights}} night(s) from {{checkIn}} to {{checkOut}}. Check-in time: {{checkInTime}}. We look forward to welcoming you!",
    isDefault: true,
  },
  {
    name: "Welcome Message",
    type: "WELCOME",
    channel: "WHATSAPP" as const,
    body: "Welcome to {{guestHouseName}}, {{guestName}}! Your room {{roomNumber}} is ready. Check-in time: {{checkInTime}}, Check-out: {{checkOutTime}}. Enjoy your stay! For any assistance, call us at {{guestHousePhone}}.",
    isDefault: true,
  },
  {
    name: "Check-out Reminder",
    type: "CHECKOUT_REMINDER",
    channel: "SMS" as const,
    body: "Dear {{guestName}}, your check-out at {{guestHouseName}} is today ({{checkOut}}). Please vacate room {{roomNumber}} by {{checkOutTime}}. Thank you for staying with us!",
    isDefault: true,
  },
  {
    name: "Reservation Confirmation",
    type: "CONFIRMATION",
    channel: "SMS" as const,
    body: "Dear {{guestName}}, your reservation at {{guestHouseName}} is confirmed. Room {{roomNumber}}, {{nights}} night(s) from {{checkIn}} to {{checkOut}}. Total: {{totalCost}}. Contact us at {{guestHousePhone}} for any changes.",
    isDefault: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    await ensureNewTables();
    const auth = await getAuthContext(req);
    const filter = getProviderFilter(auth);
    const providerId = filter.providerId;
    if (!providerId) return NextResponse.json([]);

    let templates = await db.messageTemplate.findMany({
      where: { providerId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    // Seed defaults if none exist
    if (templates.length === 0) {
      for (const t of DEFAULT_TEMPLATES) {
        await db.messageTemplate.create({
          data: { ...t, providerId },
        });
      }
      templates = await db.messageTemplate.findMany({
        where: { providerId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
    }

    return NextResponse.json(templates);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[message-templates GET]", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("does not exist") || msg.includes("Unknown table") || msg.includes("relation")) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureNewTables();
    const auth = await getAuthContext(req);
    const { providerId } = getProviderFilter(auth);
    if (!providerId) return NextResponse.json({ error: "Provider required" }, { status: 403 });

    const body = await req.json();
    const { name, type, channel, subject, body: templateBody, isDefault, isActive } = body;

    if (!name || !type || !templateBody) {
      return NextResponse.json({ error: "Name, type, and body are required" }, { status: 400 });
    }

    const template = await db.messageTemplate.create({
      data: {
        name,
        type,
        channel: channel || "SMS",
        subject: subject || "",
        body: templateBody,
        isDefault: isDefault || false,
        isActive: isActive !== false,
        providerId,
      },
    });

    const { userId, userName } = getLogUserInfo(req);
    logStaffActivity({
      req, userId, userName,
      action: "CREATE_MESSAGE_TEMPLATE",
      targetType: "MESSAGE_TEMPLATE",
      targetId: template.id,
      details: { name, type, channel },
      providerId,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[message-templates POST]", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
