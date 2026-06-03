import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Check, Trophy, BookOpen, Users, MessageSquare, Target, Loader2, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  isMarkingRead?: boolean;
};

const iconMap: Record<string, any> = {
  chapter: BookOpen,
  achievement: Trophy,
  follow: Users,
  comment: MessageSquare,
  goal: Target,
  system: Check,
};

export function NotificationList({ notifications, isLoading, onMarkAllRead, onClose, isMarkingRead = false }: Props) {
  const qc = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      // Optimistically update the notification
      await qc.cancelQueries({ queryKey: ["notifications"] });
      
      const previousNotifications = qc.getQueryData(["notifications"]);
      
      qc.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return old.map((n: any) => 
          n.id === notificationId ? { ...n, is_read: true } : n
        );
      });
      
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        qc.setQueryData(["notifications"], context.previousNotifications);
      }
    },
    onSettled: () => {
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
          <Bell className="h-8 w-8 text-violet-500" />
        </div>
        <p className="mt-4 font-medium">No notifications</p>
        <p className="mt-1 text-xs text-muted-foreground">
          You're all caught up! We'll notify you when something happens.
        </p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="h-5 rounded-full px-2 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            disabled={isMarkingRead}
            className="h-8 gap-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-950/50"
          >
            {isMarkingRead ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Marking...
              </>
            ) : (
              <>
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="h-3 w-3" />
            All caught up
          </div>
        )}
      </div>

      {/* List */}
      <ScrollArea className="max-h-96">
        <div className="divide-y">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.notification_type] || Check;
            const content = (
              <div
                className={`flex gap-3 p-4 transition-all duration-200 hover:bg-secondary/50 cursor-pointer ${
                  !notification.is_read ? "bg-violet-500/5 border-l-2 border-l-violet-500" : "border-l-2 border-l-transparent"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    !notification.is_read 
                      ? "bg-violet-500/20 ring-2 ring-violet-500/30" 
                      : "bg-violet-500/10"
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors ${
                      !notification.is_read ? "text-violet-600" : "text-violet-500"
                    }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${
                      !notification.is_read ? "font-semibold" : "font-medium"
                    }`}>{notification.title}</p>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0 mt-1 animate-pulse" />
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
