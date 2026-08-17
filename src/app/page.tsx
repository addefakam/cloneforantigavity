"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import LoginPage from "@/components/ghms/login-page";
import Sidebar from "@/components/ghms/sidebar";
import PageRenderer from "@/components/ghms/page-renderer";
import { apiGetNotifications } from "@/lib/api";
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

  const fetchNotifData = useCallback(async () => {
    try {
      const res = await apiGetNotifications();
      const list = Array.isArray(res) ? res : (res as Record<string, unknown>).notifications;
      const arr = Array.isArray(list) ? list : [];
      setUnreadCount(arr.filter((n: { isRead: boolean }) => !n.isRead).length);
      // Collect unread URGENT broadcast notifications
      const urgent = arr
        .filter((n: { isRead: boolean; title: string }) => !n.isRead && /^\[URGENT\]/.test(n.title))
        .map((n: { id: string; title: string; message: string }) => ({
          id: n.id,
          title: n.title.replace(/^\[URGENT\]\s*/, ""),
          message: n.message.split("\n")[0],
        }));
      setUrgentNotifs(urgent);
    } catch {
      // silent - non-critical
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifData();
    const interval = setInterval(fetchNotifData, 30000);
    return () => clearInterval(interval);
  }, [currentUser, fetchNotifData]);

  if (!currentUser || currentPage === "login") {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {urgentNotifs.length > 0 && (
          <div
            onClick={() => setCurrentPage("notifications")}
            className="shrink-0 bg-red-600 text-white text-sm font-medium overflow-hidden cursor-pointer hover:bg-red-700 transition-colors"
          >
            <div className="flex items-center h-8">
              <span className="shrink-0 px-3 bg-red-700 text-xs font-bold uppercase tracking-wider h-full flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
                Urgent
              </span>
              <div className="relative flex-1 overflow-hidden">
                <div className="flex animate-marquee whitespace-nowrap">
                  {urgentNotifs.map((n, i) => (
                    <span key={n.id} className="mx-8">
                      {n.title}: {n.message}
                      {i < urgentNotifs.length - 1 && "   •   "}
                    </span>
                  ))}
                </div>
              </div>
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
