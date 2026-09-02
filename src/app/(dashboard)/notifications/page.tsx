"use client";
import { useEffect, useState } from "react";
import { Card, Badge, EmptyState } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  INFO: <Info size={16} className="text-blue-500" />,
  SUCCESS: <CheckCircle2 size={16} className="text-emerald-500" />,
  WARNING: <AlertTriangle size={16} className="text-amber-500" />,
  ERROR: <XCircle size={16} className="text-red-500" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(d => {
      if (d.success) setNotifications(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update");
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i) => <Card key={i} className="p-4 h-20 skeleton">{" "}</Card>)}</div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell size={32} />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const content = (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  n.read ? "border-[var(--border)] bg-transparent" : "border-[var(--primary)]/20 bg-[var(--primary)]/5"
                }`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className="mt-0.5">{typeIcons[n.type] || typeIcons.INFO}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
