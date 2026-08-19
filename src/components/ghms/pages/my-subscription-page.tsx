"use client";

import { useState, useEffect } from "react";
import {
  apiMySubscription,
  apiSubmitPayment,
} from "@/lib/api";
import {
  formatDaysRemaining,
  formatCycle,
  getStatusBadgeClasses,
} from "@/lib/subscription";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Building2,
  ChevronRight,
  IndianRupee,
  RefreshCw,
  Send,
  Info,
  XCircle,
  Banknote,
  Smartphone,
  Landmark,
  Receipt,
  Sparkles,
  Lock,
} from "lucide-react";

// ── Types ──
interface SubData {
  subscription: {
    id: string;
    startDate: string;
    endDate: string;
    cycle: string;
    price: number;
    planId: string | null;
    status: string;
    daysRemaining: number;
  };
  provider: { name: string; ownerName: string; phone: string; status: string } | null;
  plans: {
    id: string;
    name: string;
    cycle: string;
    price: number;
    days: number;
    months: number;
    perMonth: number;
    subscribers: number;
  }[];
  payments: {
    id: string;
    amount: number;
    cycle: string;
    periodStart: string;
    periodEnd: string;
    notes: string;
    createdAt: string;
  }[];
  config: {
    currencySymbol: string;
    paymentMethod: string;
    paymentInstructions: string;
    pricePerBedPerDay: number;
    pricingEnabled: boolean;
  };
  totalBeds: number;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash", icon: Banknote, color: "text-green-600" },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark, color: "text-blue-600" },
  { value: "TELEBIRR", label: "Telebirr", icon: Smartphone, color: "text-cyan-600" },
  { value: "CBE_BIRR", label: "CBE Birr", icon: Smartphone, color: "text-orange-600" },
  { value: "OTHER", label: "Other", icon: CreditCard, color: "text-slate-600" },
];

const CYCLE_COLORS: Record<string, string> = {
  MONTHLY: "border-blue-200 bg-blue-50 hover:bg-blue-100",
  QUARTERLY: "border-purple-200 bg-purple-50 hover:bg-purple-100",
  SEMI_ANNUAL: "border-amber-200 bg-amber-50 hover:bg-amber-100",
  YEARLY: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
};

const CYCLE_ICON_COLORS: Record<string, string> = {
  MONTHLY: "text-blue-600 bg-blue-100",
  QUARTERLY: "text-purple-600 bg-purple-100",
  SEMI_ANNUAL: "text-amber-600 bg-amber-100",
  YEARLY: "text-emerald-600 bg-emerald-100",
};

// ── Skeleton ──
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-60 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export default function MySubscriptionPage() {
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubData["plans"][0] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payMethod, setPayMethod] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiMySubscription();
      setData(res as SubData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to load subscription info: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPlan = (plan: SubData["plans"][0]) => {
    setSelectedPlan(plan);
    setPayAmount(String(plan.price));
    setPayMethod("");
    setPayRef("");
    setPayNotes("");
    setShowPayDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !payMethod || !payAmount || Number(payAmount) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await apiSubmitPayment({
        planId: selectedPlan.id,
        cycle: selectedPlan.cycle,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNo: payRef,
        notes: payNotes,
      });
      toast.success("Payment submitted! Awaiting verification.");
      setShowPayDialog(false);
      fetchData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const sub = data?.subscription;
  const cur = data?.config.currencySymbol || "Br";
  const totalBeds = data?.totalBeds || 0;
  const pricePerBed = data?.config.pricePerBedPerDay || 0;
  const pricingLocked = data?.config.pricingEnabled === false;

  if (loading) return <LoadingSkeleton />;
  if (!data || !sub) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CreditCard className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No subscription found</p>
        <p className="text-xs text-slate-400 mt-1">Contact the administrator</p>
      </div>
    );
  }

  const isTrial = sub.price === 0 && data.payments.length === 0;
  const statusColor = getStatusBadgeClasses(sub.status as "ACTIVE" | "WARNING" | "GRACE" | "SUSPENDED");

  return (
    <div className="space-y-4 p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Subscription & Payments</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your subscription, view plans, and submit payments
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="h-8 text-xs"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh
        </Button>
      </div>

      {/* Pricing Info Banner */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 shrink-0">
          <Building2 className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-700">
            {cur}{pricePerBed} per bed/day x <span className="font-bold text-slate-900">{totalBeds} bed{totalBeds !== 1 ? "s" : ""}</span> = <span className="font-bold text-primary">{cur}{(pricePerBed * totalBeds).toLocaleString()}/day</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {totalBeds === 0
              ? "No rooms configured yet. Add rooms to see your subscription pricing."
              : `Your subscription is calculated based on ${totalBeds} total bed${totalBeds !== 1 ? "s" : ""} across all your rooms.`}
          </p>
        </div>
        {pricingLocked && (
          <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-500 bg-slate-100 shrink-0">
            <Lock className="w-3 h-3 mr-1" />
            Rates Locked
          </Badge>
        )}
      </div>

      {/* ═══ Current Status Card ═══ */}
      <Card className={`overflow-hidden ${
        sub.status === "WARNING" ? "border-amber-300 bg-amber-50/30" :
        sub.status === "GRACE" ? "border-rose-300 bg-rose-50/30" :
        sub.status === "SUSPENDED" ? "border-slate-300" : ""
      }`}>
        <CardContent className="p-0">
          {/* Status bar */}
          <div className={`px-4 py-3 flex items-center justify-between ${
            sub.status === "ACTIVE" ? "bg-emerald-50" :
            sub.status === "WARNING" ? "bg-amber-50" :
            sub.status === "GRACE" ? "bg-rose-50" :
            "bg-slate-50"
          }`}>
            <div className="flex items-center gap-2">
              {sub.status === "ACTIVE" ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : sub.status === "WARNING" ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : sub.status === "GRACE" ? (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400" />
              )}
              <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                {sub.status}
              </span>
              {isTrial && (
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 bg-blue-50">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Free Trial
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {formatDaysRemaining(sub.daysRemaining)}
            </span>
          </div>

          {/* Details grid */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Current Plan</p>
              <p className="text-sm font-semibold mt-0.5">
                {isTrial ? "Free Trial" : formatCycle(sub.cycle)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Amount</p>
              <p className="text-sm font-semibold mt-0.5">
                {isTrial ? "Free" : `${Number(sub.price).toLocaleString()} ${cur}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Expires On</p>
              <p className="text-sm font-semibold mt-0.5">
                {new Date(sub.endDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Provider</p>
              <p className="text-sm font-semibold mt-0.5 truncate">
                {data.provider?.name || "—"}
              </p>
            </div>
          </div>

          {/* Payment instructions */}
          {data.config.paymentInstructions && (
            <div className="px-4 pb-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed">
                  {data.config.paymentInstructions}
                </p>
              </div>
            </div>
          )}

          {/* Expiry warning message */}
          {(sub.status === "WARNING" || sub.status === "GRACE" || sub.status === "SUSPENDED") && (
            <div className="px-4 pb-4">
              <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                sub.status === "WARNING"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-rose-50 border-rose-200"
              }`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                  sub.status === "WARNING" ? "text-amber-600" : "text-rose-600"
                }`} />
                <div>
                  <p className={`text-xs font-semibold ${
                    sub.status === "WARNING" ? "text-amber-800" : "text-rose-800"
                  }`}>
                    {sub.status === "WARNING"
                      ? "Subscription expiring soon!"
                      : sub.status === "GRACE"
                      ? "Subscription expired — grace period active"
                      : "Service suspended due to unpaid subscription"}
                  </p>
                  <p className={`text-xs mt-1 ${
                    sub.status === "WARNING" ? "text-amber-700" : "text-rose-700"
                  }`}>
                    Please select a plan below and submit your payment to continue using the service.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Available Plans ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <IndianRupee className="w-4 h-4" />
            Available Plans
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {data.plans.length} plan{data.plans.length !== 1 ? "s" : ""} available
          </span>
        </div>

        {data.plans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No plans available yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact the administrator for payment instructions
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              const isCurrentPlan = sub.planId === plan.id && !isTrial;
              const colorClass = CYCLE_COLORS[plan.cycle] || "border-slate-200 bg-white";
              const iconColor = CYCLE_ICON_COLORS[plan.cycle] || "text-slate-600 bg-slate-100";

              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                    isCurrentPlan
                      ? "border-emerald-300 ring-2 ring-emerald-100"
                      : colorClass
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${iconColor}`}>
                            <CalendarDays className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">{plan.name}</h4>
                            <p className="text-[10px] text-muted-foreground">
                              {formatCycle(plan.cycle)} — {plan.days} days
                            </p>
                          </div>
                        </div>
                      </div>
                      {isCurrentPlan && (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-xl font-bold">
                          {Number(plan.price).toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground ml-1">{cur}</span>
                        </p>
                        {totalBeds > 0 && pricePerBed > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {cur}{pricePerBed} x {totalBeds} beds x {plan.days} days
                          </p>
                        )}
                        {plan.months > 1 && (
                          <p className="text-[10px] text-muted-foreground">
                            ~{plan.perMonth.toLocaleString()} {cur}/month
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isCurrentPlan ? "outline" : "default"}
                        className="h-8 text-xs"
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? "Active" : (
                          <>
                            Pay Now
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Payment History ═══ */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-slate-50/50 transition-colors py-3"
          onClick={() => setShowHistory(!showHistory)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Payment History
              {data.payments.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {data.payments.length}
                </Badge>
              )}
            </CardTitle>
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                showHistory ? "rotate-90" : ""
              }`}
            />
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="pt-0">
            {data.payments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No payment records yet
              </p>
            ) : (
              <div className="space-y-2">
                {data.payments.map((payment) => {
                  const isProviderSubmitted = payment.notes.includes("[PROVIDER SUBMITTED]");
                  const isVerified = !payment.notes.includes("[PROVIDER SUBMITTED]");
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${
                          isProviderSubmitted ? "bg-amber-100" : "bg-emerald-100"
                        }`}>
                          {isProviderSubmitted ? (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {Number(payment.amount).toLocaleString()} {cur}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatCycle(payment.cycle)} &middot;{" "}
                            {new Date(payment.periodStart).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short",
                            })}{" "}
                            —{" "}
                            {new Date(payment.periodEnd).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isProviderSubmitted
                              ? "border-amber-200 text-amber-700"
                              : "border-emerald-200 text-emerald-700"
                          }`}
                        >
                          {isProviderSubmitted ? "Pending" : "Verified"}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(payment.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ═══ Payment Dialog ═══ */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Submit Payment
            </DialogTitle>
            <DialogDescription>
              Complete your payment using any method below, then fill in the details.
              Your subscription will be activated after verification.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && data && (
            <div className="space-y-4">
              {/* Selected plan summary */}
              <div className="p-3 bg-slate-50 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{selectedPlan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCycle(selectedPlan.cycle)} — {selectedPlan.days} days
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    {Number(selectedPlan.price).toLocaleString()} {cur}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <Label className="text-xs font-medium">
                  Amount ({cur})
                </Label>
                <Input
                  type="number"
                  value={payAmount}
                  readOnly
                  className="mt-1 bg-slate-50 text-slate-700 cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Auto-calculated based on your total beds and selected plan
                </p>
              </div>

              {/* Payment method */}
              <div>
                <Label className="text-xs font-medium">
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    const isActive = payMethod === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPayMethod(m.value)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          isActive
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? m.color : "text-slate-400"}`} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference number */}
              <div>
                <Label className="text-xs font-medium">
                  Reference / Transaction Number
                </Label>
                <Input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g., TXN-123456 or receipt number"
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Enter the transaction/reference number from your payment receipt
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs font-medium">Additional Notes</Label>
                <Textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Any additional information (optional)"
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Payment instructions reminder */}
              {data.config.paymentInstructions && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed">
                    {data.config.paymentInstructions}
                  </p>
                </div>
              )}

              <Separator />

              <DialogFooter className="flex-row gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setShowPayDialog(false)}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitPayment}
                  disabled={!payMethod || !payAmount || Number(payAmount) <= 0 || submitting}
                  className="flex-1 sm:flex-none"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Payment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
