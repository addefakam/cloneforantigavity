"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, LogOut } from "lucide-react";

const STORAGE_KEY = "ghms_session";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // If the error is a session/data corruption issue, clear localStorage
  // so the user can start fresh instead of being stuck in a crash loop.
  const isSessionError =
    error.message.includes("undefined") ||
    error.message.includes("null") ||
    error.message.includes("Cannot read") ||
    error.message.includes("split");

  useEffect(() => {
    if (isSessionError) {
      console.error("[ErrorBoundary] Session-related error detected, clearing corrupted session:", error.message);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }, [isSessionError, error.message]);

  function handleReset() {
    if (isSessionError) {
      // Full page reload to start fresh after clearing session
      window.location.href = "/";
    } else {
      reset();
    }
  }

  return (
    <div suppressHydrationWarning className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <AlertTriangle className="h-7 w-7 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-500">
          {isSessionError
            ? "Your session data was corrupted and has been cleared. Please sign in again."
            : error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            {isSessionError ? "Sign In Again" : "Try Again"}
          </button>
          {isSessionError && (
            <button
              onClick={() => {
                try { localStorage.removeItem(STORAGE_KEY); } catch {}
                window.location.href = "/";
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Clear & Reload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}