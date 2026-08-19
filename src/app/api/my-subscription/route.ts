import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext, AuthError } from "@/lib/tenant";
import {
  calcSubscriptionStatus,
  calcNextEndDate,
  CYCLE_DAYS,
  TRIAL_DAYS,
  WARNING_DAYS,
  GRACE_DAYS,
} from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth.providerId) {
      return NextResponse.json({ error: "No provider associated" }, { status: 400 });
    }

    // Fetch everything in parallel
    const [subscription, provider, plans, payments, sysSettings] = await Promise.all([
      db.subscription.findFirst({ where: { providerId: auth.providerId } }),
      db.provider.findFirst({
        where: { id: auth.providerId },
        select: { name: true, ownerName: true, phone: true, status: true },
      }),
      db.subscriptionPlan.findMany({
        where: { isActive: true },
        include: { _count: { select: { subscriptions: true } } },
        orderBy: { price: "asc" },
      }),
      db.subscriptionPayment.findMany({
        where: { subscription: { providerId: auth.providerId } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.settings.findFirst({ where: { providerId: null } }),
    ]);

    // Extract payment config
    let paymentConfig = {
      trialDays: TRIAL_DAYS,
      warningDays: WARNING_DAYS,
      graceDays: GRACE_DAYS,
      currencySymbol: "Br",
      paymentMethod: "manual",
      paymentInstructions: "",
    };
    if (sysSettings?.configJson && typeof sysSettings.configJson === "object") {
      const config = sysSettings.configJson as Record<string, unknown>;
      const payment = config.payment;
      if (payment && typeof payment === "object") {
        const p = payment as Record<string, unknown>;
        paymentConfig = {
          trialDays: (p.trialDays as number) ?? TRIAL_DAYS,
          warningDays: (p.warningDays as number) ?? WARNING_DAYS,
          graceDays: (p.graceDays as number) ?? GRACE_DAYS,
          currencySymbol: (p.currencySymbol as string) ?? "Br",
          paymentMethod: (p.paymentMethod as string) ?? "manual",
          paymentInstructions: (p.paymentInstructions as string) ?? "",
        };
      }
    }

    // Auto-create trial if needed
    let finalSub = subscription;
    if (!finalSub && provider?.status === "APPROVED") {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + paymentConfig.trialDays);
      try {
        finalSub = await db.subscription.create({
          data: {
            providerId: auth.providerId,
            startDate: now,
            endDate: trialEnd,
            cycle: "MONTHLY",
            price: 0,
          },
        });
      } catch {
        finalSub = await db.subscription.findFirst({ where: { providerId: auth.providerId } });
      }
    }

    if (!finalSub) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const { status, daysRemaining } = calcSubscriptionStatus(finalSub.endDate, {
      warningDays: paymentConfig.warningDays,
      graceDays: paymentConfig.graceDays,
    });

    // Enrich plans
    const enrichedPlans = plans.map((p) => {
      const days = CYCLE_DAYS[p.cycle] || 30;
      const months = days / 30;
      return {
        id: p.id,
        name: p.name,
        cycle: p.cycle,
        price: p.price,
        days,
        months,
        perMonth: months > 0 ? Math.round((p.price / months) * 100) / 100 : p.price,
        subscribers: p._count.subscriptions,
      };
    });

    return NextResponse.json({
      subscription: {
        id: finalSub.id,
        startDate: finalSub.startDate.toISOString(),
        endDate: finalSub.endDate.toISOString(),
        cycle: finalSub.cycle,
        price: finalSub.price,
        planId: finalSub.planId,
        status,
        daysRemaining,
      },
      provider: provider,
      plans: enrichedPlans,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        cycle: p.cycle,
        periodStart: p.periodStart.toISOString(),
        periodEnd: p.periodEnd.toISOString(),
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      })),
      config: paymentConfig,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth.providerId) {
      return NextResponse.json({ error: "No provider associated" }, { status: 400 });
    }

    const body = await req.json();
    const { planId, cycle, amount, paymentMethod, referenceNo, notes } = body;

    if (!cycle || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Please select a plan and enter amount" },
        { status: 400 }
      );
    }

    const validCycles = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "YEARLY"];
    if (!validCycles.includes(cycle)) {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }

    // Get current subscription
    const subscription = await db.subscription.findFirst({
      where: { providerId: auth.providerId },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    // Calculate new period
    const periodStart = new Date(
      Math.max(Date.now(), new Date(subscription.endDate).getTime())
    );
    const periodEnd = calcNextEndDate(subscription.endDate, cycle);

    // Resolve plan if provided
    let resolvedPlanId = subscription.planId;
    if (planId) {
      const plan = await db.subscriptionPlan.findFirst({
        where: { id: planId, isActive: true },
      });
      if (plan) {
        resolvedPlanId = plan.id;
      }
    }

    // Build payment notes with provider's reference info
    const paymentNotes = [
      `[PROVIDER SUBMITTED]`,
      paymentMethod ? `Method: ${paymentMethod}` : "",
      referenceNo ? `Ref: ${referenceNo}` : "",
      notes || "",
    ]
      .filter(Boolean)
    .join(" | ");

    // Update subscription + create payment in transaction
    await db.$transaction([
      db.subscription.update({
        where: { id: subscription.id },
        data: {
          startDate: periodStart,
          endDate: periodEnd,
          cycle,
          price: Number(amount),
          ...(resolvedPlanId ? { planId: resolvedPlanId } : {}),
        },
      }),
      db.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount: Number(amount),
          cycle,
          periodStart,
          periodEnd,
          markedBy: auth.userId,
          notes: paymentNotes,
        },
      }),
    ]);

    // Fetch provider for notification
    const provider = await db.provider.findFirst({
      where: { id: auth.providerId },
      select: { name: true, ownerName: true },
    });

    // Create notification for superuser to verify
    await db.notification.create({
      data: {
        title: "[PAYMENT] Subscription Payment Submitted",
        message: `${provider?.name || "Provider"} submitted ${Number(amount).toLocaleString()} Br (${cycle}) payment. Reference: ${referenceNo || "N/A"}. Please verify and confirm.

${notes || ""}`,
        type: "WARNING",
        link: "",
      },
    });

    return NextResponse.json({
      success: true,
      newEndDate: periodEnd.toISOString(),
      message: "Payment submitted successfully. Your subscription will be activated once verified.",
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to submit payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
