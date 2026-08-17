"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAppStore } from "@/lib/store";
import {
  apiGetNotifications,
  apiCreateNotification,
  apiMarkNotificationRead,
} from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell,
  BellOff,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  MessageSquarePlus,
  Shield,
  Megaphone,
  AlertOctagon,
  FileText,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link: string | null;
}

// Priority-level detection from notification title (police broadcasts)
const PRIORITY_STYLE: Record<
  string,
  {
    icon: React.ElementType;
    badge: string;
    badgeLabel: string;
    border: string;
    bg: string;
    iconColor: string;
  }
> = {
  URGENT: {
    icon: AlertOctagon,
    badge: "bg-red-100 text-red-700 border-red-300",
    badgeLabel: "Urgent",
    border: "border-red-300 bg-red-50/60",
    bg: "bg-red-50/60",
    iconColor: "text-red-600",
  },
  "HIGH PRIORITY": {
    icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-700 border-amber-300",
    badgeLabel: "High Priority",
    border: "border-amber-300 bg-amber-50/60",
    bg: "bg-amber-50/60",
    iconColor: "text-amber-600",
  },
  NOTICE: {
    icon: Megaphone,
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    badgeLabel: "Police Notice",
    border: "border-blue-200 bg-blue-50/40",
    bg: "bg-blue-50/40",
    iconColor: "text-blue-600",
  },
  LOW: {
    icon: FileText,
    badge: "bg-slate-100 text-slate-600 border-slate-300",
    badgeLabel: "Low Priority",
    border: "border-slate-200 bg-slate-50/40",
    bg: "bg-slate-50/40",
    iconColor: "text-slate-500",
  },
};

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; badge: string; label: string }
> = {
  INFO: {
    icon: Info,
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    label: "Info",
  },
  WARNING: {
    icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Warning",
  },
  SUCCESS: {
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "Success",
  },
  ERROR: {
    icon: XCircle,
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "Error",
  },
  CONCERN: {
    icon: MessageSquarePlus,
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    label: "Concern",
  },
};

/** Detect if a notification is a police/admin broadcast from its title prefix */
function detectBroadcastPriority(title: string) {
  const match = title.match(/^\[(URGENT|HIGH PRIORITY|NOTICE|LOW)\]/);
  return match ? match[1] : null;
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const { refreshKey, currentUser } = useAppStore();
  const isSuperuser = currentUser?.role === "SUPERUSER";
  const isOperator = currentUser?.role === "OPERATOR";
  const canSubmitConcern = isSuperuser || isOperator;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Concern dialog
  const [concernOpen, setConcernOpen] = useState(false);
  const [concernTitle, setConcernTitle] = useState("");
  const [concernMessage, setConcernMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetNotifications();
      const list = Array.isArray(res) ? res : (res as Record<string, unknown>).notifications;
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, refreshKey]);

  const markRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.isRead) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await apiMarkNotificationRead(id);
    } catch {
      toast.error("Failed to mark as read");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSubmitConcern = async (e: FormEvent) => {
    e.preventDefault();
    if (!concernTitle.trim() || !concernMessage.trim()) {
      toast.error("Please fill in the subject and message");
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiCreateNotification({
        title: concernTitle.trim(),
        message: concernMessage.trim(),
        type: "CONCERN",
      });
      setNotifications((prev) => [created, ...prev]);
      toast.success("Concern submitted successfully");
      setConcernOpen(false);
      setConcernTitle("");
      setConcernMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit concern";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {canSubmitConcern ? "Notifications & Concerns" : "Notifications"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {notifications.filter((n) => !n.isRead).length} unread
          </p>
        </div>
        {canSubmitConcern && (
          <Button onClick={() => setConcernOpen(true)} className="gap-2 shrink-0">
            <MessageSquarePlus className="h-4 w-4" />
            Submit Concern
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <BellOff className="mb-4 h-12 w-12 opacity-30" />
          <p className="font-medium text-lg">No notifications</p>
          <p className="text-sm mt-1">
            {canSubmitConcern
              ? "Submit a concern, or check back later for updates."
              : "You&apos;re all caught up. New notifications will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isBroadcast = detectBroadcastPriority(n.title);
            const priorityStyle = isBroadcast ? PRIORITY_STYLE[isBroadcast] : null;
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            const Icon = isBroadcast && priorityStyle ? priorityStyle.icon : cfg.icon;

            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`
                  group relative flex items-start gap-4 rounded-lg border p-4 transition-colors cursor-pointer
                  ${n.isRead
                    ? isBroadcast && priorityStyle
                      ? priorityStyle.border.replace(/border-\S+\s/, 'border-slate-200 ').replace(/bg-\S+\s*/, 'bg-card')
                      : "bg-card"
                    : isBroadcast && priorityStyle
                      ? priorityStyle.border
                      : "bg-primary/[0.03] border-primary/20"}
                  hover:bg-accent/50
                `}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    n.isRead
                      ? "bg-muted"
                      : isBroadcast && priorityStyle
                        ? priorityStyle.bg
                        : "bg-primary/10"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      n.isRead
                        ? "text-muted-foreground"
                        : isBroadcast && priorityStyle
                          ? priorityStyle.iconColor
                          : "text-primary"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3
                      className={`text-sm font-semibold ${
                        n.isRead ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    {isBroadcast && priorityStyle ? (
                      <Badge variant="outline" className={`${priorityStyle.badge} gap-1`}>
                        <Shield className="h-3 w-3" />
                        {priorityStyle.badgeLabel}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={cfg.badge}>
                        {cfg.label}
                      </Badge>
                    )
                  </div>
                  <p
                    className={`text-sm leading-relaxed whitespace-pre-line ${
                      n.isRead ? "text-muted-foreground" : "text-foreground/80"
                    }`}
                  >
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Concern Dialog */}
      <Dialog open={concernOpen} onOpenChange={setConcernOpen}>
        <DialogContent className="mx-4 sm:mx-0 w-[calc(100%-2rem)] sm:w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-violet-500" />
              Submit Concern
            </DialogTitle>
            <DialogDescription>
              {isOperator
                ? "Send a concern or password issue to the system admin. They will be notified and can take action."
                : "Send a concern or request. It will be reviewed and actioned."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitConcern} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="concern-title">Subject *</Label>
              <Input
                id="concern-title"
                placeholder="Brief subject of your concern"
                value={concernTitle}
                onChange={(e) => setConcernTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concern-message">Message *</Label>
              <Textarea
                id="concern-message"
                placeholder="Describe your concern in detail..."
                rows={4}
                value={concernMessage}
                onChange={(e) => setConcernMessage(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConcernOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? "Submitting..." : "Submit Concern"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}