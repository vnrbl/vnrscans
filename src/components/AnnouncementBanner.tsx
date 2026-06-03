import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  show_banner: boolean;
  banner_color: string | null;
  icon: string | null;
  target_audience: string;
};

export function AnnouncementBanner() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_vip, created_at")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const announcements = useQuery({
    queryKey: ["announcements", "active", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .eq("show_banner", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
  });

  const readIds = useQuery({
    queryKey: ["announcements", "read", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_announcements")
        .select("announcement_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.announcement_id));
    },
  });

  const dismiss = useMutation({
    mutationFn: async (announcementId: string) => {
      if (user) {
        await supabase.from("user_announcements").upsert(
          { user_id: user.id, announcement_id: announcementId },
          { onConflict: "user_id,announcement_id" }
        );
      }
      sessionStorage.setItem(`announcement_dismissed_${announcementId}`, "1");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  if (!announcements.data?.length) return null;

  const visible = announcements.data.filter((a) => {
    if (sessionStorage.getItem(`announcement_dismissed_${a.id}`)) return false;
    if (user && readIds.data?.has(a.id)) return false;
    if (a.target_audience === "vip" && !profile.data?.is_vip) return false;
    if (a.target_audience === "new_users") {
      const created = profile.data?.created_at ? new Date(profile.data.created_at) : null;
      if (!created || Date.now() - created.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });

  const top = visible[0];
  if (!top) return null;

  const typeStyles: Record<string, string> = {
    info: "border-primary/40 bg-primary/10",
    warning: "border-yellow-500/40 bg-yellow-500/10",
    success: "border-green-500/40 bg-green-500/10",
    error: "border-destructive/40 bg-destructive/10",
    event: "border-accent/40 bg-accent/10",
  };

  return (
    <div
      className={`border-b px-4 py-3 ${typeStyles[top.type] ?? typeStyles.info}`}
      style={top.banner_color ? { borderColor: top.banner_color, backgroundColor: `${top.banner_color}15` } : undefined}
    >
      <div className="container mx-auto flex items-start gap-3">
        {top.icon && <span className="text-xl leading-none">{top.icon}</span>}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{top.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{top.content}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => dismiss.mutate(top.id)}
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
