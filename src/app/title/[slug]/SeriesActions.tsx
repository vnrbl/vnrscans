"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, UserPlus, UserCheck, Star, Bookmark } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XP_AMOUNTS } from "@/lib/xp";

/* ------------------------------------------------------------------ */
/*  SeriesActions — cover image + follow/rate/library action buttons.  */
/*  Isolated so chapter interactions never trigger these to re-render. */
/* ------------------------------------------------------------------ */

interface SeriesActionsProps {
  slug: string;
  seriesId: string;
  coverUrl: string | null;
  title: string;
  readChapterSlug: string | undefined;
  readButtonText: string;
  hasChapters: boolean;
}

export const SeriesActions = React.memo(function SeriesActions({
  slug,
  seriesId,
  coverUrl,
  title,
  readChapterSlug,
  readButtonText,
  hasChapters,
}: SeriesActionsProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const isFollowing = useQuery({
    queryKey: ["following", slug, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_library")
        .select("id")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const libraryStatus = useQuery({
    queryKey: ["library-status", slug, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_library")
        .select("reading_status")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .maybeSingle();
      return data?.reading_status ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const myRating = useQuery({
    queryKey: ["rating", slug, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("ratings")
        .select("rating")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .maybeSingle();
      return data?.rating ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to follow");
      if (isFollowing.data) {
        await supabase.from("user_library").delete().eq("user_id", user.id).eq("series_id", seriesId);
        return { wasFollowing: true };
      }
      await supabase.from("user_library").insert({
        user_id: user.id,
        series_id: seriesId,
        reading_status: "reading",
      });
      return { wasFollowing: false };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["following", slug] });
      qc.invalidateQueries({ queryKey: ["library-status", slug] });
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["followers-count", slug] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
      qc.invalidateQueries({ queryKey: ["xp-history"] });
      if (result?.wasFollowing) {
        toast.success("Unfollowed");
      } else {
        toast.success(`Following — +${XP_AMOUNTS.follow_series} XP earned`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rate = useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error("Sign in to rate");
      const { error } = await supabase
        .from("ratings")
        .upsert({ user_id: user.id, series_id: seriesId, rating }, { onConflict: "user_id,series_id" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rating", slug] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["xp-history"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("Rating saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (status: "reading" | "completed" | "plan_to_read" | "dropped") => {
      if (!user) throw new Error("Sign in to set status");
      const { error } = await supabase
        .from("user_library")
        .update({
          reading_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("series_id", seriesId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-status", slug] });
      qc.invalidateQueries({ queryKey: ["library"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <aside className="mx-auto w-full max-w-[180px] shrink-0 sm:mx-0 sm:max-w-[220px]">
      <div className="overflow-hidden rounded-xl border border-border/40 bg-secondary shadow-2xl transition-all duration-300 hover:border-primary/30">
        {coverUrl ? (
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={coverUrl}
              alt={title}
              fill
              priority
              unoptimized
              sizes="(max-width: 640px) 180px, 220px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center text-muted-foreground">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {hasChapters && readChapterSlug && (
          <Link
            href={`/title/${slug}/${readChapterSlug}`}
            className="block"
          >
            <Button className="h-11 w-full bg-primary text-base font-semibold hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10">
              <BookOpen className="mr-2 h-4 w-4" />
              {readButtonText}
            </Button>
          </Link>
        )}

        {user && !isFollowing.data && (
          <Button
            className="h-11 w-full bg-primary/90 font-semibold hover:bg-primary text-primary-foreground"
            onClick={() => toggleFollow.mutate()}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Follow
          </Button>
        )}

        {user && isFollowing.data && (
          <Select
            value={libraryStatus.data ?? "reading"}
            onValueChange={(v) => setStatus.mutate(v as any)}
          >
            <SelectTrigger className="h-11 w-full border-primary/40 bg-primary/10 font-semibold text-primary">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                <SelectValue placeholder="Reading" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="plan_to_read">Plan to Read</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
        )}

        {user && isFollowing.data && (
          <Button
            variant="outline"
            className="h-10 w-full border-border/60"
            onClick={() => toggleFollow.mutate()}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Following
          </Button>
        )}
      </div>

      {user && (
        <div className="mt-5 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => rate.mutate(n)} aria-label={`Rate ${n}`}>
              <Star
                className={`h-5 w-5 transition duration-200 ${
                  (myRating.data ?? 0) >= n
                    ? "fill-primary text-primary filter drop-shadow-[0_0_4px_rgba(236,72,153,0.2)]"
                    : "text-muted-foreground hover:text-primary"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
});
