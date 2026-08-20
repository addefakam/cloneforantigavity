"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/store";
import LoginPage from "@/components/ghms/login-page";
import Sidebar from "@/components/ghms/sidebar";
import PageRenderer from "@/components/ghms/page-renderer";
import { apiGetNotifications, apiMarkNotificationRead } from "@/lib/api";
import { Bell } from "lucide-react";

interface UrgentNotif {
  id: string;
  title: string;
  message: string;
}

export default function Home() {
  const { currentUser, currentPage, setCurrentPage } = useAppStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentNotifs, setUrgentNotifs] = useState<UrgentNotif[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Handle Chapa payment redirect from /my-subscription?chapa=success bridge page ──
  useEffect(() => {
    const raw = sessionStorage.getItem("chapa_callback");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      // Only process if less than 5 minutes old
      if (Date.now() - (data.timestamp || 0) < 5 * 60 * 1000) {
        // Store the params for MySubscriptionPage to pick up via sessionStorage
        // (it already checks sessionStorage as fallback after useSearchParams)
        sessionStorage.setItem("chapa_result", data.chapa);
        sessionStorage.setItem("chapa_sub", data.sub || "");
        setCurrentPage("my-subscription");
      }
    } catch {
      // Invalid JSON, ignore
    }
    sessionStorage.removeItem("chapa_callback");
  }, [setCurrentPage]);

  const fetchNotifData = useCallback(async () => {
    try {
      const res = await apiGetNotifications();
      const raw = res as Record<string, unknown> | unknown[];
      const list = Array.isArray(raw) ? raw : raw?.notifications;
      const arr: Record<string, unknown>[] = Array.isArray(list) ? list : [];
      setUnreadCount(arr.filter((n) => !n.isRead).length);
      // Collect unread URGENT broadcast notifications
      const urgent = arr
        .filter((n) => !n.isRead && typeof n.title === "string" && n.title.startsWith("[URGENT]"))
        .map((n) => ({
          id: n.id as string,
          title: (n.title as string).replace(/^\[URGENT\]\s*/, ""),
          message: ((n.message as string) || "").split("\n")[0],
        }));
      setUrgentNotifs(urgent);
    } catch {
      // silent - non-critical
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifData();
    const interval = setInterval(fetchNotifData, 15000);
    return () => clearInterval(interval);
  }, [currentUser, fetchNotifData]);

  if (!currentUser || currentPage === "login") {
    return <LoginPage />;
  }

  const tickerText = urgentNotifs
    .map((n) => `${n.title}: ${n.message}`)
    .join("     \u2022     ");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {urgentNotifs.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              // Mark all urgent as read, clear ticker, navigate to notifications
              const ids = urgentNotifs.map((n) => n.id);
              setUrgentNotifs([]);
              setUnreadCount((c) => Math.max(0, c - ids.length));
              ids.forEach((id) => apiMarkNotificationRead(id).catch(() => {}));
              setCurrentPage("notifications");
            }}
            onKeyDown={(e) => { if (e.key === "Enter") setCurrentPage("notifications"); }}
            className="shrink-0 bg-red-600 text-white text-sm font-medium overflow-hidden cursor-pointer hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            <div className="flex items-center h-8">
              <span className="shrink-0 px-3 bg-red-800 text-[11px] font-bold uppercase tracking-wider h-full flex items-center gap-1.5 z-10 relative">
                <span className="inline-block h-2 w-2 rounded-full bg-red-300 animate-pulse" />
                URGENT
              </span>
              <div className="relative flex-1 overflow-hidden">
                <div
                  ref={scrollRef}
                  className="urgent-ticker-track flex whitespace-nowrap pointer-events-none"
                  style={{ animation: `urgent-scroll ${Math.max(15, tickerText.length * 0.15)}s linear infinite` }}
                >
                  <span className="px-8">{tickerText}</span>
                  <span className="px-8">{tickerText}</span>
                </div>
              </div>
              <span className="shrink-0 px-3 text-[11px] text-red-200 z-10 relative">
                Click to view →
              </span>
            </div>
          </div>
        )}
        <header className="flex items-center justify-end px-4 md:px-6 h-12 shrink-0 bg-white border-b border-slate-100">
          <button
            onClick={() => setCurrentPage("notifications")}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto pl-4 md:pl-6">
          <PageRenderer />
        </main>
      </div>
    </div>
  );
}
