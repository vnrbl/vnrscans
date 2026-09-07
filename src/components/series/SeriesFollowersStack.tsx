"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ElasticStack, ElasticStackItem } from "@/components/ui/elastic-stack";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Search, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAppDate } from "@/lib/date";

export interface SeriesFollower {
  userId: string;
  username: string;
  avatarUrl: string | null;
  userLevel: number;
  readingStreak: number;
  createdAt: string;
}

interface SeriesFollowersStackProps {
  seriesId: string;
  seriesTitle?: string;
  slug?: string;
  followersCount?: number;
  itemSize?: number;
  className?: string;
  showText?: boolean;
}

export function SeriesFollowersStack({
  seriesId,
  seriesTitle = "Series",
  slug,
  followersCount,
  itemSize = 32,
  className,
  showText = true,
}: SeriesFollowersStackProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  // Fetch ACTUAL followers for this series from user_library joined with profiles
  const followersQ = useQuery({
    queryKey: ["series-actual-followers", seriesId],
    queryFn: async (): Promise<SeriesFollower[]> => {
      if (!seriesId) return [];

      const { data: libraryRows, error: libErr } = await supabase
        .from("user_library")
        .select("user_id, created_at")
        .eq("series_id", seriesId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (libErr || !libraryRows || libraryRows.length === 0) return [];

      const userIds = libraryRows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, user_level, reading_streak")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      return libraryRows.map((row) => {
        const prof = profileMap.get(row.user_id);
        return {
          userId: row.user_id,
          username: prof?.username || "Reader",
          avatarUrl: prof?.avatar_url || null,
          userLevel: prof?.user_level || 1,
          readingStreak: prof?.reading_streak || 0,
          createdAt: row.created_at,
        };
      });
    },
    enabled: !!seriesId,
    staleTime: 1000 * 60 * 2,
  });

  const allFollowers = followersQ.data || [];
  // Use maximum of database count and fetched items count
  const effectiveTotal = typeof followersCount === "number" ? followersCount : allFollowers.length;

  // Display at most 4-5 avatars
  const MAX_VISIBLE = 4;
  const visibleFollowers = useMemo(() => allFollowers.slice(0, MAX_VISIBLE), [allFollowers]);

  // Convert to ElasticStackItem format
  const stackItems: ElasticStackItem[] = useMemo(() => {
    return visibleFollowers.map((f) => ({
      id: f.userId,
      name: f.username,
      image: f.avatarUrl,
      href: `/user/${f.username}`,
    }));
  }, [visibleFollowers]);

  // Remaining count strictly equals total minus visible avatars
  const remainingCount = Math.max(0, effectiveTotal - visibleFollowers.length);

  // Filtered followers inside the modal dialog
  const modalFollowers = useMemo(() => {
    if (!filterQuery.trim()) return allFollowers;
    const q = filterQuery.toLowerCase();
    return allFollowers.filter((f) => f.username.toLowerCase().includes(q));
  }, [allFollowers, filterQuery]);

  // If 0 followers, render clean status
  if (effectiveTotal === 0 && allFollowers.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("inline-flex items-center gap-2 flex-wrap text-xs font-sans", className)}>
        {showText && (
          <span className="text-neutral-400 font-medium select-none">
            Followed by
          </span>
        )}

        {/* ElasticStack of actual visible follower avatars */}
        {stackItems.length > 0 && (
          <ElasticStack
            items={stackItems}
            itemSize={itemSize}
            className="py-0"
            onItemClick={(item) => {
              if (item.href) router.push(item.href);
            }}
          />
        )}

        {/* Clickable "and X others" trigger if there are more followers */}
        {remainingCount > 0 ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-neutral-400 hover:text-white font-medium transition-colors cursor-pointer hover:underline underline-offset-2 flex items-center gap-1"
          >
            <span>and <strong className="text-white font-mono">{remainingCount.toLocaleString()}</strong> others</span>
          </button>
        ) : (
          // If only 1 or all followers are visible, clicking opens the followers list
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="View followers"
            className="text-neutral-400 hover:text-white font-medium transition-colors cursor-pointer hover:underline underline-offset-2"
          >
            {visibleFollowers.length === 1 && (
              <span className="text-neutral-300 font-medium">({visibleFollowers[0].username})</span>
            )}
          </button>
        )}
      </div>

      {/* Followers Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col p-0 overflow-hidden bg-neutral-950 border border-neutral-800 text-white shadow-2xl">
          <DialogHeader className="p-4 pb-3 border-b border-neutral-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white leading-none">
                  Followers
                </DialogTitle>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-1 font-normal">
                  {seriesTitle} • {effectiveTotal.toLocaleString()} total
                </p>
              </div>
            </div>

            {slug && (
              <Link
                href={`/title/${slug}/followers`}
                onClick={() => setModalOpen(false)}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors pr-6"
              >
                <span>Full Page</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </DialogHeader>

          {/* Search bar inside modal */}
          {allFollowers.length > 5 && (
            <div className="px-4 pt-3 pb-1 border-b border-neutral-900">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900/80 border border-neutral-800 text-xs">
                <Search className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter followers..."
                  className="bg-transparent text-white outline-none w-full placeholder:text-neutral-500 font-normal"
                />
                {filterQuery && (
                  <button onClick={() => setFilterQuery("")} className="text-neutral-500 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Followers List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-neutral-900">
            {followersQ.isLoading ? (
              <div className="py-8 text-center text-xs text-neutral-500 font-sans">
                Loading followers...
              </div>
            ) : modalFollowers.length > 0 ? (
              modalFollowers.map((follower) => (
                <div
                  key={follower.userId}
                  onClick={() => {
                    setModalOpen(false);
                    router.push(`/user/${follower.username}`);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {follower.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={follower.avatarUrl}
                        alt={follower.username}
                        className="h-9 w-9 rounded-full object-cover border border-neutral-800 group-hover:border-neutral-600 transition-colors shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-400 shrink-0">
                        {follower.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                        {follower.username}
                      </div>
                      <div className="text-2xs text-neutral-500 font-sans truncate">
                        Level {follower.userLevel} • {follower.readingStreak}d streak
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {formatAppDate(follower.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500 font-sans">
                {filterQuery ? `No followers matching "${filterQuery}"` : "No followers recorded yet."}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SeriesFollowersStack;
