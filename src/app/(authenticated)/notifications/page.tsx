"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { safeUrlOrNull } from "@/lib/safe-url";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  CheckCheck,
  Trophy,
  BookOpen,
  Users,
  MessageSquare,
  Target,
  Loader2,
  Trash2,
  Inbox,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const iconMap: Record<string, any> = {
  chapter: BookOpen,
  achievement: Trophy,
  follow: Users,
  comment: MessageSquare,
  goal: Target,
  system: Sparkles,
};

const typeLabels: Record<string, string> = {
  chapter: "New Chapters",
  achievement: "Achievements",
  follow: "Follows",
  comment: "Comments",
  goal: "Goals",
  system: "System",
};

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

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      return (data || []) as Notification[];
    },
    staleTime: 30 * 1000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("user_id", u.user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData(["notifications"]);
      qc.setQueryData(["notifications"], (old: any) =>
        old ? old.map((n: any) => ({ ...n, is_read: true })) : old
      );
      return { prev };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["notifications"], ctx.prev);
      toast.error("Failed to mark as read");
    },
    onSuccess: () => toast.success("All marked as read"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData(["notifications"]);
      qc.setQueryData(["notifications"], (old: any) =>
        old ? old.map((n: any) => (n.id === id ? { ...n, is_read: true } : n)) : old
      );
      return { prev };
    },
    onError: (_err: any, _id: any, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["notifications"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData(["notifications"]);
      qc.setQueryData(["notifications"], (old: any) =>
        old ? old.filter((n: any) => n.id !== id) : old
      );
      return { prev };
    },
    onError: (_err: any, _id: any, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["notifications"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Notification deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const allNotifications = notifications.data || [];
  const unreadCount = allNotifications.filter((n) => !n.is_read).length;

  // Get unique notification types for filter tabs
  const types = Array.from(new Set(allNotifications.map((n) => n.notification_type)));

  // Filter notifications
  const filtered =
    filter === "all"
      ? allNotifications
      : filter === "unread"
        ? allNotifications.filter((n) => !n.is_read)
        : allNotifications.filter((n) => n.notification_type === filter);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Group by date (only the paginated ones)
  const grouped = paginated.reduce<Record<string, Notification[]>>((acc, n) => {
    const date = format(new Date(n.created_at), "MMMM d, yyyy");
    if (!acc[date]) acc[date] = [];
    acc[date].push(n);
    return acc;
  }, {});

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:px-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10">
            <Bell className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} • {allNotifications.length} total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate(undefined)}
            disabled={markAllRead.isPending || unreadCount === 0}
            className="gap-2"
          >
            {markAllRead.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            Mark all read
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")} count={allNotifications.length}>
          All
        </FilterPill>
        <FilterPill active={filter === "unread"} onClick={() => setFilter("unread")} count={unreadCount}>
          Unread
        </FilterPill>
        {types.map((type) => {
          const count = allNotifications.filter((n) => n.notification_type === type).length;
          return (
            <FilterPill key={type} active={filter === type} onClick={() => setFilter(type)} count={count}>
              {typeLabels[type] || type}
            </FilterPill>
          );
        })}
      </div>

      {/* Notifications list */}
      {notifications.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-violet-500/10">
            <Inbox className="h-8 w-8 text-violet-500/60" />
          </div>
          <p className="mt-4 font-semibold">
            {filter === "unread" ? "No unread notifications" : "No notifications"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "unread"
              ? "You're all caught up!"
              : "We'll notify you when something happens."}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {date}
              </p>
              <Card className="divide-y divide-border/40 overflow-hidden">
                {items.map((n) => {
                  const Icon = iconMap[n.notification_type] || Check;
                  return (
                    <div
                      key={n.id}
                      className={`group flex items-start gap-4 p-4 transition-colors ${
                        !n.is_read
                          ? "bg-violet-500/5 border-l-2 border-l-violet-500"
                          : "border-l-2 border-l-transparent hover:bg-secondary/30"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`mt-0.5 grid h-10 w-10 flex-shrink-0 place-items-center rounded-full transition-colors ${
                          !n.is_read
                            ? "bg-violet-500/20 ring-2 ring-violet-500/30"
                            : "bg-violet-500/10"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            !n.is_read ? "text-violet-600" : "text-violet-500"
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>
                              {n.link_url && safeUrlOrNull(n.link_url) ? (
                                <Link
                                  to={n.link_url as any}
                                  className="hover:underline"
                                  onClick={() => {
                                    if (!n.is_read) markOneRead.mutate(n.id);
                                  }}
                                >
                                  {n.title}
                                </Link>
                              ) : (
                                n.title
                              )}
                            </p>
                            {n.message && (
                              <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                            )}
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </p>
                          </div>

                          {/* Unread dot */}
                          {!n.is_read && (
                            <div className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-violet-500 animate-pulse" />
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!n.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markOneRead.mutate(n.id)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteNotification.mutate(n.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-4 items-center justify-between border-t border-border/40 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{filtered.length}</span> notifications
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (totalPages > 5) {
                    if (
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - currentPage) > 1
                    ) {
                      if (pageNum === 2 && currentPage > 3) {
                        return <span key="ellipsis-start" className="px-1 text-muted-foreground select-none">...</span>;
                      }
                      if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                        return <span key="ellipsis-end" className="px-1 text-muted-foreground select-none">...</span>;
                      }
                      return null;
                    }
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`h-8 w-8 text-xs font-semibold ${currentPage === pageNum ? "bg-violet-500 text-white hover:bg-violet-600" : "hover:bg-secondary"}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-violet-500 text-white shadow-sm"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      }`}
    >
      {children}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          active ? "bg-white/20" : "bg-background"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
