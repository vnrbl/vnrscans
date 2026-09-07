import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Users, ShieldCheck, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchSeriesBySlug } from "@/lib/series-slug";
import { formatAppDate } from "@/lib/date";

export const revalidate = 60; // 1 min ISR cache

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await fetchSeriesBySlug(slug, "title");
  if (!series) return { title: "Followers - vnrscans" };
  return {
    title: `Followers of ${series.title} - vnrscans`,
    description: `See all readers and fans following ${series.title} on vnrscans.`,
  };
}

export default async function SeriesFollowersPage({ params }: PageProps) {
  const { slug } = await params;
  const series = await fetchSeriesBySlug(slug, "id, slug, title, cover_url, type, view_count");
  if (!series) notFound();

  // Query all followers for this series
  const { data: libraryRows } = await supabase
    .from("user_library")
    .select("user_id, created_at")
    .eq("series_id", series.id)
    .order("created_at", { ascending: false });

  const followersCount = libraryRows?.length || 0;
  let followers: Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    userLevel: number;
    readingStreak: number;
    createdAt: string;
  }> = [];

  if (libraryRows && libraryRows.length > 0) {
    const userIds = libraryRows.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, user_level, reading_streak")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    followers = libraryRows.map((row) => {
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
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 pt-8 sm:pt-12 font-sans">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={`/title/${slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900/70 hover:bg-neutral-800/90 border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to {series.title}</span>
          </Link>
        </div>

        {/* Series Banner Header */}
        <div className="flex items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-xl border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-xl mb-8">
          {series.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={series.cover_url}
              alt={series.title}
              className="h-20 w-14 sm:h-24 sm:w-16 rounded-md object-cover border border-white/10 shrink-0 shadow-lg"
            />
          ) : (
            <div className="h-20 w-14 sm:h-24 sm:w-16 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
              <Users className="h-6 w-6" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <span className="text-3xs uppercase tracking-widest font-mono font-bold text-neutral-400">
              Series Community
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-tight text-white truncate mt-1">
              Followers of {series.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
              <strong className="text-white font-mono">{followersCount.toLocaleString()}</strong> reader{followersCount === 1 ? "" : "s"} following this series
            </p>
          </div>
        </div>

        {/* Followers Grid / List */}
        {followers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {followers.map((follower) => (
              <Link
                key={follower.userId}
                href={`/user/${follower.username}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-950/50 hover:bg-neutral-900/70 hover:border-neutral-700 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {follower.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={follower.avatarUrl}
                      alt={follower.username}
                      className="h-10 w-10 rounded-full object-cover border border-white/10 group-hover:border-white/30 transition-colors shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-400 shrink-0">
                      {follower.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                      {follower.username}
                    </div>
                    <div className="text-xs text-neutral-400 font-sans mt-0.5 truncate">
                      Level {follower.userLevel} • {follower.readingStreak}d streak
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {formatAppDate(follower.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center">
            <Users className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-300">No followers yet</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Be the first to follow {series.title} and stay updated on new chapter releases!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
