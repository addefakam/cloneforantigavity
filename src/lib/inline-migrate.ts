/**
 * Inline migration helper — runs critical schema fixes directly via Prisma.
 * This exists because init-db.ts has multi-layer caching (pg → Prisma fallback, _initDone flag)
 * that can become stale on Vercel warm instances. This function bypasses all of that
 * and runs DDL statements directly on a fresh Prisma connection.
 *
 * Each statement is idempotent: duplicate errors are silently ignored.
 * Called at the top of API routes that depend on newer columns/tables.
 */
import { PrismaClient } from "@prisma/client";

let _inlineDone = false;
let _inlinePromise: Promise<void> | null = null;

/** Critical DDL statements that must run before subscription features work. */
const CRITICAL_DDL = [
  // Settings.configJson — needed by subscription, system config, etc.
  `ALTER TABLE "Settings" ADD COLUMN "configJson" JSONB`,
  // Subscription tables (in case they don't exist)
  `CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_providerId_key" UNIQUE ("providerId")
  )`,
  `CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "cycle" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "markedBy" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  // Subscription.planId column (added later)
  `ALTER TABLE "Subscription" ADD COLUMN "planId" TEXT`,
  // Reservation: second-guest / exceptionally-reserved columns
  `ALTER TABLE "Reservation" ADD COLUMN "secondGuestName" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Reservation" ADD COLUMN "secondGuestPhone" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Reservation" ADD COLUMN "secondGuestIdNumber" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Reservation" ADD COLUMN "exceptionallyReserved" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Reservation" ADD COLUMN "exceptionReason" TEXT NOT NULL DEFAULT ''`,
  // Seed default plans
  `INSERT INTO "SubscriptionPlan" ("id","name","cycle","price","isActive","createdAt","updatedAt")
   SELECT 'plan-monthly-001','Monthly','MONTHLY',500,true,NOW(),NOW()
   WHERE NOT EXISTS (SELECT 1 FROM "SubscriptionPlan" WHERE "id"='plan-monthly-001')`,
  `INSERT INTO "SubscriptionPlan" ("id","name","cycle","price","isActive","createdAt","updatedAt")
   SELECT 'plan-quarterly-001','Quarterly','QUARTERLY',1400,true,NOW(),NOW()
   WHERE NOT EXISTS (SELECT 1 FROM "SubscriptionPlan" WHERE "id"='plan-quarterly-001')`,
  `INSERT INTO "SubscriptionPlan" ("id","name","cycle","price","isActive","createdAt","updatedAt")
   SELECT 'plan-semi-annual-001','Semi-Annual','SEMI_ANNUAL',2600,true,NOW(),NOW()
   WHERE NOT EXISTS (SELECT 1 FROM "SubscriptionPlan" WHERE "id"='plan-semi-annual-001')`,
  `INSERT INTO "SubscriptionPlan" ("id","name","cycle","price","isActive","createdAt","updatedAt")
   SELECT 'plan-yearly-001','Annual','YEARLY',4800,true,NOW(),NOW()
   WHERE NOT EXISTS (SELECT 1 FROM "SubscriptionPlan" WHERE "id"='plan-yearly-001')`,
];

/**
 * Run critical inline migrations. Safe to call multiple times — runs once per cold start.
 * Uses a FRESH PrismaClient (not the cached db proxy) to avoid any caching issues.
 */
export async function ensureInlineMigrations(): Promise<void> {
  if (_inlineDone) return;
  if (_inlinePromise) return _inlinePromise;

  _inlinePromise = (async () => {
    const prisma = new PrismaClient({ log: [] });
    try {
      for (const ddl of CRITICAL_DDL) {
        try {
          await prisma.$executeRawUnsafe(ddl);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // Silently ignore duplicate column/table/object errors
          if (
            !/duplicate_column/i.test(msg) &&
            !/duplicate_object/i.test(msg) &&
            !/already exists/i.test(msg) &&
            !/relation .* already exists/i.test(msg)
          ) {
            console.error("[inline-migrate] Statement failed:", ddl.slice(0, 80), msg);
          }
        }
      }
      _inlineDone = true;
    } catch (err) {
      console.error("[inline-migrate] Failed:", err instanceof Error ? err.message : String(err));
      _inlinePromise = null; // Allow retry
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  })();

  return _inlinePromise;
}
