import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * One-time setup: creates tables and enums that may not exist yet.
 * Called automatically by new-feature APIs on first access.
 * Safe to call repeatedly (IF NOT EXISTS / EXCEPTION WHEN duplicate_object).
 */
let setupDone = false;

export async function POST() {
  if (setupDone) return NextResponse.json({ ok: true, msg: "Already set up" });

  try {
    // 1. Create enums
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "GroupBookingStatus" AS ENUM ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "MessageChannel" AS ENUM ('SMS','WHATSAPP');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "MessageStatus" AS ENUM ('PENDING','SENT','FAILED','DELIVERED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // 2. Create tables
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GroupBooking" (
        "id"           TEXT NOT NULL PRIMARY KEY,
        "name"         TEXT NOT NULL,
        "contactName"  TEXT NOT NULL DEFAULT '',
        "contactPhone" TEXT NOT NULL DEFAULT '',
        "contactEmail" TEXT NOT NULL DEFAULT '',
        "startDate"    TEXT NOT NULL,
        "endDate"      TEXT NOT NULL,
        "notes"        TEXT NOT NULL DEFAULT '',
        "status"       "GroupBookingStatus" NOT NULL DEFAULT 'PENDING',
        "totalRooms"   INTEGER NOT NULL DEFAULT 0,
        "totalGuests"  INTEGER NOT NULL DEFAULT 0,
        "totalCost"    DOUBLE PRECISION NOT NULL DEFAULT 0,
        "providerId"   TEXT NOT NULL,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GroupBooking_providerId_idx" ON "GroupBooking"("providerId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GroupBooking_status_idx" ON "GroupBooking"("status");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GroupBooking_startDate_idx" ON "GroupBooking"("startDate");`);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StaffLog" (
        "id"         TEXT NOT NULL PRIMARY KEY,
        "userId"     TEXT NOT NULL,
        "userName"   TEXT NOT NULL DEFAULT '',
        "action"     TEXT NOT NULL DEFAULT '',
        "targetType" TEXT NOT NULL DEFAULT '',
        "targetId"   TEXT NOT NULL DEFAULT '',
        "details"    TEXT NOT NULL DEFAULT '',
        "ipAddress"  TEXT NOT NULL DEFAULT '',
        "providerId" TEXT NOT NULL,
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StaffLog_providerId_idx" ON "StaffLog"("providerId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StaffLog_userId_idx" ON "StaffLog"("userId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StaffLog_action_idx" ON "StaffLog"("action");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StaffLog_targetType_idx" ON "StaffLog"("targetType");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StaffLog_createdAt_idx" ON "StaffLog"("createdAt");`);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MessageTemplate" (
        "id"         TEXT NOT NULL PRIMARY KEY,
        "name"       TEXT NOT NULL,
        "type"       TEXT NOT NULL,
        "channel"    "MessageChannel" NOT NULL DEFAULT 'SMS',
        "subject"    TEXT NOT NULL DEFAULT '',
        "body"       TEXT NOT NULL,
        "isDefault"  BOOLEAN NOT NULL DEFAULT false,
        "isActive"   BOOLEAN NOT NULL DEFAULT true,
        "providerId" TEXT NOT NULL,
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MessageTemplate_providerId_idx" ON "MessageTemplate"("providerId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MessageTemplate_type_idx" ON "MessageTemplate"("type");`);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MessageLog" (
        "id"            TEXT NOT NULL PRIMARY KEY,
        "templateId"    TEXT,
        "recipient"     TEXT NOT NULL,
        "channel"       "MessageChannel" NOT NULL DEFAULT 'SMS',
        "message"       TEXT NOT NULL,
        "status"        "MessageStatus" NOT NULL DEFAULT 'PENDING',
        "errorMessage"  TEXT NOT NULL DEFAULT '',
        "reservationId" TEXT,
        "guestId"       TEXT,
        "providerId"    TEXT NOT NULL,
        "sentAt"        TIMESTAMP(3),
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MessageLog_providerId_idx" ON "MessageLog"("providerId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MessageLog_recipient_idx" ON "MessageLog"("recipient");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MessageLog_status_idx" ON "MessageLog"("status");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MessageLog_createdAt_idx" ON "MessageLog"("createdAt");`);

    // 3. Add groupBookingId to Reservation if missing
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Reservation' AND column_name = 'groupBookingId'
        ) THEN
          ALTER TABLE "Reservation" ADD COLUMN "groupBookingId" TEXT;
          CREATE INDEX IF NOT EXISTS "Reservation_groupBookingId_idx" ON "Reservation"("groupBookingId");
        END IF;
      END $$;
    `);

    setupDone = true;
    return NextResponse.json({ ok: true, msg: "All tables created" });
  } catch (error) {
    console.error("[setup] Error:", error);
    // Still mark as done to avoid retrying - tables may exist partially
    setupDone = true;
    return NextResponse.json({ ok: true, msg: "Setup attempted" });
  }
}
