import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Check, Trophy, BookOpen, Users, MessageSquare, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Notification = {
  id: string;
  notification_type: string;
  title: string;
  message: string | null;
  link_url: string | null;
  icon: string | null;
  is_read: boolean;
  created_at: string;
};

type Props = {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAllRead: () => void;
  onClose: () => void;
};

const iconMap: Record<string, any> = {
  chapter: BookOpen,
  achievement: Trophy,
  follow: Users,
  comment: MessageSquare,
  goal: Target,
  system: Check,
};

export function NotificationList({ notifications, isLoading, onMarkAllRead, onClose }: Props) {
  const qc = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link_url) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="max-h-96">
        <div className="divide-y">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.notification_type] || Check;
            const content = (
              <div
                className={`flex gap-3 p-4 transition-colors hover:bg-secondary/50 cursor-pointer ${
                  !notification.is_read ? "bg-violet-500/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                    <Icon className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{notification.title}</p>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  {notification.message && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );

            return notification.link_url ? (
              <Link key={notification.id} to={notification.link_url as any}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
