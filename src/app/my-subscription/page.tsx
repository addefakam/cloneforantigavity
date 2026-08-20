"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Bridge page for Chapa payment redirect.
 *
 * Chapa redirects to /my-subscription?chapa=success&sub=XXX after payment.
 * Since the app is a client-side SPA (all pages rendered via Zustand store),
 * this page captures the query params, stores them in sessionStorage,
 * and redirects to the main SPA at "/".
 *
 * The MySubscriptionPage component then reads from sessionStorage to trigger verification.
 */
function ChapaBridge() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const chapa = searchParams.get("chapa");
    const sub = searchParams.get("sub");

    if (chapa) {
      sessionStorage.setItem(
        "chapa_callback",
        JSON.stringify({ chapa, sub, timestamp: Date.now() })
      );
    }

    // Redirect to main SPA — the app will detect the stored params
    // and navigate to the my-subscription page automatically
    window.location.replace("/");
  }, [searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-600">Processing payment redirect...</p>
      </div>
    </div>
  );
}

export default function MySubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <ChapaBridge />
    </Suspense>
  );
}
