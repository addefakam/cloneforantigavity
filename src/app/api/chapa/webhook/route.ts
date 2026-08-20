import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureInlineMigrations } from "@/lib/inline-migrate";
import {
  verifyPayment,
  extractSubscriptionIdPrefix,
  type ChapaWebhookPayload,
} from "@/lib/chapa";

/**
 * POST /api/chapa/webhook
 *
 * Webhook endpoint called by Chapa after payment completion.
 * This route is PUBLIC (no auth) — Chapa calls it server-to-server.
 *
 * Flow:
 *  1. Receive webhook payload from Chapa
 *  2. Verify the transaction with Chapa API (double-verify)
 *  3. Find the pending SubscriptionPayment by tx_ref
 *  4. Update the payment record and subscription dates
 *  5. Notify superuser
 */
export async function POST(req: NextRequest) {
  try {
    await ensureInlineMigrations();

    // Parse webhook payload
    const payload = (await req.json()) as ChapaWebhookPayload;

    // Only process payment success events
    if (payload.event !== "charge.completed") {
      console.log("[Chapa Webhook] Ignoring event:", payload.event);
      return NextResponse.json({ received: true });
    }

    const { tx_ref, status } = payload.data;

    if (!tx_ref) {
      console.error("[Chapa Webhook] Missing tx_ref");
      return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
    }

    // ── Double-verify with Chapa API ──
    let verification;
    try {
      verification = await verifyPayment(tx_ref);
    } catch (err) {
      console.error("[Chapa Webhook] Verification API call failed:", err);
      return NextResponse.json({ error: "Verification failed" }, { status: 502 });
    }

    // Check if payment is actually successful
    if (verification.data.status !== "success") {
      console.log(
        `[Chapa Webhook] Payment not successful. Status: ${verification.data.status}, tx_ref: ${tx_ref}`
      );
      return NextResponse.json({ received: true, status: verification.data.status });
    }

    // ── Find the pending payment record by tx_ref in notes ──
    const pendingPayments = await db.subscriptionPayment.findMany({
      where: {
        notes: { contains: tx_ref },
      },
      include: {
        subscription: {
          include: {
            provider: {
              select: { name: true, ownerName: true },
            },
          },
        },
      },
    });

    if (pendingPayments.length === 0) {
      console.error("[Chapa Webhook] No payment record found for tx_ref:", tx_ref);
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    // Process all matching pending payments (should typically be 1)
    for (const payment of pendingPayments) {
      // Skip if already processed (idempotency)
      if (payment.notes.includes("[CHAPA VERIFIED]")) {
        console.log("[Chapa Webhook] Already processed:", payment.id);
        continue;
      }

      const subscription = payment.subscription;
      const providerName = subscription.provider?.name || "Unknown Provider";

      // ── Update the payment record ──
      await db.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          notes: payment.notes.replace(
            "[CHAPA PENDING]",
            "[CHAPA VERIFIED]"
          ),
        },
      });

      // ── Extend the subscription dates ──
      const periodStart = payment.periodStart;
      const periodEnd = payment.periodEnd;

      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          startDate: periodStart,
          endDate: periodEnd,
          cycle: payment.cycle,
          price: payment.amount,
        },
      });

      // ── Notify superuser ──
      await db.notification.create({
        data: {
          title: "[PAYMENT] Chapa Payment Verified",
          message: `Chapa payment of ${payment.amount.toLocaleString()} ETB (${payment.cycle}) from ${providerName} has been verified and subscription extended to ${new Date(periodEnd).toLocaleDateString("en-GB")}. TxRef: ${tx_ref} | Method: ${verification.data.payment_method}`,
          type: "SUCCESS",
          link: "",
        },
      });

      console.log(
        `[Chapa Webhook] Payment verified and subscription extended. Provider: ${providerName}, Amount: ${payment.amount}, TxRef: ${tx_ref}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    console.error("[Chapa Webhook Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Handle GET requests (Chapa may send GET for verification)
export async function GET() {
  return NextResponse.json({ status: "ok", service: "GHMS Chapa Webhook" });
}
