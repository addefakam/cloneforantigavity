import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext, getProviderFilter, AuthError } from "@/lib/tenant";
import { logStaffActivity, getLogUserInfo } from "@/lib/staff-log";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext(req);
    const { providerId } = getProviderFilter(auth);
    if (!providerId) return NextResponse.json({ error: "Provider required" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { name, type, channel, subject, body: templateBody, isActive } = body;

    const existing = await db.messageTemplate.findFirst({ where: { id, providerId } });
    if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const updated = await db.messageTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(channel !== undefined ? { channel } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(templateBody !== undefined ? { body: templateBody } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    const { userId, userName } = getLogUserInfo(req);
    logStaffActivity({
      req, userId, userName,
      action: "UPDATE_MESSAGE_TEMPLATE",
      targetType: "MESSAGE_TEMPLATE",
      targetId: id,
      details: { changes: body },
      providerId,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[message-templates PUT]", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext(req);
    const { providerId } = getProviderFilter(auth);
    if (!providerId) return NextResponse.json({ error: "Provider required" }, { status: 403 });

    const { id } = await params;
    const existing = await db.messageTemplate.findFirst({ where: { id, providerId } });
    if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    if (existing.isDefault) {
      return NextResponse.json({ error: "Cannot delete default template" }, { status: 400 });
    }

    await db.messageTemplate.delete({ where: { id } });

    const { userId, userName } = getLogUserInfo(req);
    logStaffActivity({
      req, userId, userName,
      action: "DELETE_MESSAGE_TEMPLATE",
      targetType: "MESSAGE_TEMPLATE",
      targetId: id,
      details: { name: existing.name },
      providerId,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[message-templates DELETE]", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
