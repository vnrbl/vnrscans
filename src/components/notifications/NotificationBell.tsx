import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationList } from "./NotificationList";

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch notifications
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
        .limit(20);
      
      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  // Mark all as read
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.data?.filter((n) => !n.is_read).length || 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <NotificationList
          notifications={notifications.data || []}
          isLoading={notifications.isLoading}
          onMarkAllRead={() => markAllRead.mutate()}
          onClose={() => setOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
