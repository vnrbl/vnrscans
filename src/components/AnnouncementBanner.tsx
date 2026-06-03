import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Crown } from "lucide-react";
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

  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-r from-gray-900 via-purple-900/20 to-gray-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
      
      <div className="container relative mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon and Content */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 ring-1 ring-violet-600/40">
              {top.icon ? (
                <span className="text-2xl">{top.icon}</span>
              ) : (
                <Crown className="h-5 w-5 text-violet-400" />
              )}
            </div>

            {/* Title and Description */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white">{top.title}</h3>
              <p className="mt-0.5 truncate text-xs text-gray-300">{top.content}</p>
            </div>
          </div>

          {/* Center: Price Badge (if available) */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <div className="rounded-lg bg-orange-600/20 px-4 py-1.5 ring-1 ring-orange-500/40">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-orange-400">$2.99</span>
                <span className="text-xs text-orange-300">/month</span>
              </div>
            </div>
          </div>

          {/* Right: Action Button and Close */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              className="bg-violet-600 font-semibold text-white hover:bg-violet-700"
            >
              Subscribe Now
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-gray-400 hover:bg-white/10 hover:text-white"
              onClick={() => dismiss.mutate(top.id)}
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
