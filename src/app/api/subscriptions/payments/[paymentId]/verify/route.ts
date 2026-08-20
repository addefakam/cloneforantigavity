import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext, AuthError } from "@/lib/tenant";

/**
 * POST /api/subscriptions/payments/[paymentId]/verify
 * Superuser verifies (approves) or rejects a provider-submitted payment.
 *
 * Body: { action: "approve" | "reject", reason?: string }
 *
 * Approve: replaces [PROVIDER SUBMITTED] tag with [VERIFIED] in notes.
 * Reject:  deletes the payment and reverts the subscription endDate to periodStart.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    if (auth.role !== "SUPERUSER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { paymentId } = await params;
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const body = await req.json();
    const { action, reason } = body as {
      action: "approve" | "reject";
      reason?: string;
    };

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Reason is REQUIRED for rejection
    if (action === "reject" && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: "Decline reason is required. Please explain why this payment is being rejected." },
        { status: 400 }
      );
    }

    // Fetch the payment with its subscription
    const payment = await db.subscriptionPayment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            provider: { select: { id: true, name: true, ownerName: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Only allow verifying payments that have [PROVIDER SUBMITTED] tag
    if (!payment.notes.includes("[PROVIDER SUBMITTED]")) {
      return NextResponse.json(
        { error: "This payment is not pending verification" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Replace the [PROVIDER SUBMITTED] tag with [VERIFIED]
      const newNotes = payment.notes
        .replace("[PROVIDER SUBMITTED]", "[VERIFIED]")
        + (reason ? ` | Verified: ${reason}` : "");

      await db.subscriptionPayment.update({
        where: { id: paymentId },
        data: { notes: newNotes },
      });

      // Create notification for the provider
      await db.notification.create({
        data: {
          title: "Payment Verified",
          message: `Your payment of ${payment.amount.toLocaleString()} Br (${payment.cycle}) has been verified and confirmed. Thank you!`,
          type: "SUCCESS",
          link: "/subscription",
        },
      });

      return NextResponse.json({ success: true, message: "Payment verified" });
    }

    // REJECT — delete payment and revert subscription
    // Delete the payment first
    await db.subscriptionPayment.delete({
      where: { id: paymentId },
    });

    // Revert subscription endDate to the periodStart (before this payment extended it)
    const revertEndDate = new Date(payment.periodStart);
    // If periodStart === now (subscription was expired), revert to a past date won't help,
    // so keep it as is but the payment is removed. The status recalculation on the
    // subscriptions page will show correct status.
    await db.subscription.update({
      where: { id: payment.subscriptionId },
      data: { endDate: revertEndDate },
    });

    // Notify provider with clear decline reason
    await db.notification.create({
      data: {
        title: "Payment Declined",
        message: `Your payment of ${payment.amount.toLocaleString()} Br (${payment.cycle}) has been declined by the admin.\n\nReason: ${reason!.trim()}\n\nPlease correct the issue and resubmit your payment. Contact support if you need help.`,
        type: "WARNING",
        link: "/subscription",
      },
    });

    return NextResponse.json({ success: true, message: "Payment rejected" });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
