import { db } from "./db";
import { sql } from "@prisma/client";
import { dispatchAlertForMatch } from "./alert-dispatcher";

let tablesEnsured = false;

/**
 * Ensure the SuspectMatch, SuspectedPerson, and SuspectId tables exist.
 * Runs once per cold start. Uses raw SQL for PostgreSQL compatibility.
 */
async function ensureTables() {
  if (tablesEnsured) return;
  try {
    // Always ensure SuspectId table exists (not in Prisma schema, so not created by migrations)
    await db.$executeRaw(sql`
      CREATE TABLE IF NOT EXISTS "SuspectId" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "suspectedPersonId" TEXT NOT NULL,
        "idType" TEXT NOT NULL DEFAULT 'National_ID',
        "idNumber" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("suspectedPersonId") REFERENCES "SuspectedPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await db.$executeRaw(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "SuspectId_idNumber_idType_idx" ON "SuspectId"("idNumber", "idType");
    `);
    await db.$executeRaw(sql`
      CREATE INDEX IF NOT EXISTS "SuspectId_suspectedPersonId_idx" ON "SuspectId"("suspectedPersonId");
    `);
    tablesEnsured = true;
    console.log("[suspect-check] SuspectId table ensured");
  } catch (error) {
    console.error("[suspect-check] Failed to ensure SuspectId table:", error);
  }
}

/**
 * Check if a person matches any suspected person BY ID NUMBER ONLY.
 * Searches both the legacy single idNumber field and the new SuspectId table.
 * A suspect might have multiple IDs (national ID, passport, driver license, etc.).
 */
export async function checkSuspectMatch(params: {
  name: string;
  phone?: string;
  idNumber?: string;
  idType?: string;
  matchType: string;
  providerId: string;
  providerName?: string;
  reservationId?: string;
  daytimeBookingId?: string;
  extraDetails?: Record<string, unknown>;
}) {
  try {
    await ensureTables();

    const { name, phone, idNumber, idType, matchType, providerId, providerName, reservationId, daytimeBookingId, extraDetails } = params;

    if (!idNumber || idNumber.trim().length < 2) return;

    const normalizedId = idNumber.trim();

    // --- Step 1: Find all suspect IDs that match the guest's ID number ---
    // Search the new SuspectId table (case-insensitive exact match on idNumber)
    const matchingIds = await db.$queryRaw<{ suspectedPersonId: string }[]>(
      sql`SELECT DISTINCT "suspectedPersonId" FROM "SuspectId" WHERE LOWER("idNumber") = LOWER(${normalizedId})`
    );

    const suspectPersonIds = matchingIds.map((r) => r.suspectedPersonId);

    // Also search the legacy single idNumber field for backwards compatibility
    const legacyMatches = await db.suspectedPerson.findMany({
      where: {
        is_active: true,
        idNumber: { not: "" },
      },
      select: { id: true },
    });

    for (const lm of legacyMatches) {
      if (lm.idNumber.trim().toLowerCase() === normalizedId.toLowerCase()) {
        if (!suspectPersonIds.includes(lm.id)) {
          suspectPersonIds.push(lm.id);
        }
      }
    }

    if (suspectPersonIds.length === 0) {
      console.log(`[suspect-check] No match for ID: ${normalizedId}`);
      return;
    }

    console.log(`[suspect-check] MATCH FOUND for ID: ${normalizedId} -> ${suspectPersonIds.length} suspect(s)`);

    // --- Step 2: Fetch full suspect records ---
    const suspects = await db.suspectedPerson.findMany({
      where: { id: { in: suspectPersonIds }, is_active: true },
    });

    if (suspects.length === 0) return;

    // Get provider name if not provided
    let provName = providerName || "";
    if (!provName) {
      const provider = await db.provider.findUnique({ where: { id: providerId }, select: { name: true } });
      provName = provider?.name || "";
    }

    // Build detail string with all relevant information
    const details = JSON.stringify({
      matchType,
      guestName: name,
      guestPhone: phone || "",
      guestIdNumber: normalizedId,
      guestIdType: idType || "",
      providerName: provName,
      providerId,
      reservationId: reservationId || null,
      daytimeBookingId: daytimeBookingId || null,
      matchedAt: new Date().toISOString(),
      ...extraDetails,
    });

    // Create a match record for each suspect found
    for (const suspect of suspects) {
      const match = await db.suspectMatch.create({
        data: {
          suspectedPersonId: suspect.id,
          matchType,
          guestName: name,
          guestPhone: phone || "",
          guestIdNumber: normalizedId,
          providerName: provName,
          providerId,
          reservationId: reservationId || null,
          daytimeBookingId: daytimeBookingId || null,
          details,
        },
      });

      // Fire-and-forget alert dispatch — never blocks or breaks normal flow
      dispatchAlertForMatch(
        { id: suspect.id, name: suspect.name, severity: suspect.severity, is_active: suspect.is_active },
        {
          matchId: match.id,
          providerId: match.providerId,
          providerName: match.providerName,
          guestName: match.guestName,
          guestPhone: match.guestPhone,
          guestIdNumber: match.guestIdNumber,
          matchType: match.matchType,
          details: match.details,
        }
      ).catch(() => {});
    }
  } catch (error) {
    // Log but never throw — suspect checking should not break normal operations
    console.error("[suspect-check] Background check failed:", error);
  }
}

/**
 * Ensure tables exist — can be called from API routes too.
 */
export async function ensureSuspectTables() {
  await ensureTables();
}
