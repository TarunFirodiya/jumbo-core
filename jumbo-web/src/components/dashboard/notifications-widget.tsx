"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useTransition } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsWidgetProps {
  notifications: NotificationItem[];
  unreadCount: number;
}

export function NotificationsWidget({
  notifications,
  unreadCount: initialUnreadCount,
}: NotificationsWidgetProps) {
  const [items, setItems] = useState(notifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  const markAsRead = async (id: string) => {
    startTransition(async () => {
      try {
        // Optimistic update
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));

        await fetch(`/api/v1/notifications/${id}/read`, { method: "POST" });
      } catch {
        // Revert on failure
        setItems(notifications);
        setUnreadCount(initialUnreadCount);
      }
    });
  };

  const markAllAsRead = async () => {
    startTransition(async () => {
      try {
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        await fetch(`/api/v1/notifications/mark-all-read`, { method: "POST" });
      } catch {
        setItems(notifications);
        setUnreadCount(initialUnreadCount);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="size-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
              disabled={isPending}
            >
              <Check className="size-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No notifications yet.
          </p>
        ) : (
          items.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                notif.isRead ? "border-border opacity-70" : "border-primary/20 bg-primary/5"
              }`}
            >
              <div
                className={`mt-1 size-2 rounded-full shrink-0 ${
                  notif.isRead ? "bg-transparent" : "bg-primary"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{notif.title}</p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="size-3" />
                    </Link>
                  )}
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      disabled={isPending}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
