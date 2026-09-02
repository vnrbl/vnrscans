import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, User as UserIcon, Users, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNavigate, Link } from "@/lib/router-compat";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  buildSeriesSearchOrFilter,
  getSearchDisplayTerm,
  prepareSearchInput,
  rankSeriesResults,
} from "@/lib/search-utils";

type SearchTab = "comics" | "users" | "groups";

const seriesTypeLabels: Record<string, string> = {
  manga: "Manga",
  manhwa: "Manhwa",
  manhua: "Manhua",
  novel: "Novels",
};

const readingTypeOrder = ["manga", "manhwa", "manhua", "novel"];

interface NavbarSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavbarSearch({ open, onOpenChange }: NavbarSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchTab, setActiveSearchTab] = useState<SearchTab>("comics");
  const [searching, setSearching] = useState(false);
  const [seriesResults, setSeriesResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [groupResults, setGroupResults] = useState<string[]>([]);
  const navigate = useNavigate();

  // Instant route prefetching when search dialog is opened
  useEffect(() => {
    if (open) {
      router.prefetch("/browse");
      router.prefetch("/request-series");
    }
  }, [open, router]);

  const hotSeries = useQuery({
    queryKey: ["navbar-hot-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,view_count,is_trending")
        .eq("is_hidden", false)
        .order("is_trending", { ascending: false })
        .order("view_count", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
    staleTime: 10 * 60 * 1000,
  });

  // In-memory search cache for instant sub-millisecond response on backspace/repeat
  const searchCacheRef = useRef<Map<string, { series: any[]; users: any[]; groups: string[] }>>(new Map());

  // Ultra-fast search with in-memory caching and 120ms debounce
  useEffect(() => {
    const rawQ = searchQuery.trim();
    if (!rawQ || rawQ.length < 2) {
      setSeriesResults([]);
      setUserResults([]);
      setGroupResults([]);
      setSearching(false);
      return;
    }

    const prepared = prepareSearchInput(rawQ);
    const cacheKey = `${activeSearchTab}:${prepared.normalized}`;

    // 1. Instant Cache Hit (0ms latency!)
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached) {
      setSeriesResults(cached.series);
      setUserResults(cached.users);
      setGroupResults(cached.groups);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      const q = prepared.primaryTerm;
      if (q.length >= 2) {
        setSearching(true);
        try {
          if (activeSearchTab === "comics") {
            const seriesFilter = buildSeriesSearchOrFilter(prepared.terms);
            // Ultra-lean select without heavy descriptions for lightning response
            const { data: seriesData, error } = await supabase
              .from("series")
              .select("id,slug,title,alternative_titles,cover_url,type")
              .eq("is_hidden", false)
              .or(seriesFilter)
              .limit(30);

            if (error) throw error;
            const ranked = seriesData ? rankSeriesResults(seriesData, prepared).slice(0, 24) : [];
            setSeriesResults(ranked);

            searchCacheRef.current.set(cacheKey, {
              series: ranked,
              users: userResults,
              groups: groupResults,
            });
          } else if (activeSearchTab === "users") {
            const { data: usersData, error } = await supabase
              .from("profiles")
              .select("username,avatar_url")
              .ilike("username", `%${q}%`)
              .limit(8);

            if (error) throw error;
            const users = usersData || [];
            setUserResults(users);

            searchCacheRef.current.set(cacheKey, {
              series: seriesResults,
              users,
              groups: groupResults,
            });
          } else if (activeSearchTab === "groups") {
            const { data: groupsData, error } = await supabase
              .from("series_import_sources")
              .select("scanlation_group")
              .ilike("scanlation_group", `%${q}%`)
              .not("scanlation_group", "is", null)
              .limit(10);

            if (error) throw error;
            const uniqueGroups = groupsData
              ? (Array.from(
                  new Set(groupsData.map((c: any) => c.scanlation_group).filter(Boolean))
                ) as string[]).slice(0, 10)
              : [];
            setGroupResults(uniqueGroups);

            searchCacheRef.current.set(cacheKey, {
              series: seriesResults,
              users: userResults,
              groups: uniqueGroups,
            });
          }
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setSearching(false);
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [searchQuery, activeSearchTab]);

  const handleSearchSelect = (slug: string) => {
    onOpenChange(false);
    setSearchQuery("");
    setSeriesResults([]);
    setUserResults([]);
    setGroupResults([]);
    navigate({ to: "/title/$slug", params: { slug } });
  };

  const handleUserSelect = (username: string) => {
    onOpenChange(false);
    setSearchQuery("");
    setSeriesResults([]);
    setUserResults([]);
    setGroupResults([]);
    navigate({ to: "/user/$username", params: { username } });
  };

  const handleGroupSelect = (groupName: string) => {
    onOpenChange(false);
    setSearchQuery("");
    setSeriesResults([]);
    setUserResults([]);
    setGroupResults([]);
    navigate({ to: "/browse", search: { group: groupName } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12vh] max-h-[78vh] w-[calc(100vw-1.5rem)] max-w-[620px] translate-y-0 overflow-hidden rounded border-neutral-800 bg-neutral-950 p-0 shadow-2xl sm:top-[14vh] [&>button]:hidden">
        <div className="border-b border-neutral-900 p-3">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded border border-neutral-800 bg-neutral-950 px-3 focus-within:border-neutral-500 transition-colors">
              <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground stroke-[1.5]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const q = searchQuery.trim();
                    if (!q) return;
                    onOpenChange(false);
                    setSearchQuery("");
                    navigate({ to: "/browse", search: { search: q } });
                  }
                }}
                autoFocus
                placeholder="Search manga by title, author or synopsis (Press Enter to Browse)..."
                className="h-10 min-w-0 flex-1 bg-transparent font-sans text-sm font-normal tracking-normal text-white outline-none placeholder:text-neutral-500 placeholder:opacity-100"
              />
              {searching && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
            </div>
            <kbd className="hidden rounded border border-border bg-[#2b2b31] px-2 py-1 text-[10px] font-semibold text-muted-foreground sm:inline-flex">
              ESC
            </kbd>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="grid h-8 w-8 place-items-center rounded border border-neutral-800 text-neutral-400 transition hover:bg-neutral-900 hover:text-white"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-neutral-900 p-3">
          <div className="grid h-9 grid-cols-3 gap-2 rounded border border-neutral-800 bg-neutral-950 p-1">
            <SearchTabButton
              active={activeSearchTab === "comics"}
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label="Comics"
              onClick={() => setActiveSearchTab("comics")}
            />
            <SearchTabButton
              active={activeSearchTab === "users"}
              icon={<UserIcon className="h-3.5 w-3.5" />}
              label="Users"
              onClick={() => setActiveSearchTab("users")}
            />
            <SearchTabButton
              active={activeSearchTab === "groups"}
              icon={<Users className="h-3.5 w-3.5" />}
              label="Groups"
              onClick={() => setActiveSearchTab("groups")}
            />
          </div>
        </div>

        <div className="max-h-[54vh] overflow-y-auto px-3 py-4">
          {activeSearchTab === "comics" && (
            <SeriesSearchPanel
              query={searchQuery}
              loading={searching || hotSeries.isLoading}
              items={searchQuery.trim().length >= 2 ? seriesResults : hotSeries.data ?? []}
              onSelect={handleSearchSelect}
              onClose={() => {
                onOpenChange(false);
                setSearchQuery("");
              }}
            />
          )}
          {activeSearchTab === "users" && (
            <UserSearchPanel
              query={searchQuery}
              loading={searching}
              items={userResults}
              onSelect={handleUserSelect}
            />
          )}
          {activeSearchTab === "groups" && (
            <GroupSearchPanel
              query={searchQuery}
              loading={searching}
              items={groupResults}
              onSelect={handleGroupSelect}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-2 rounded px-2 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
        active
          ? "bg-white text-black"
          : "text-neutral-400 hover:text-white"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function SeriesSearchPanel({
  query,
  loading,
  items,
  onSelect,
  onClose,
}: {
  query: string;
  loading: boolean;
  items: any[];
  onSelect: (slug: string) => void;
  onClose?: () => void;
}) {
  const displayQuery = getSearchDisplayTerm(query);
  const isSearching = query.trim().length >= 2;

  const grouped = readingTypeOrder
    .map((type) => ({
      type,
      items: items.filter((item) => item.type === type).slice(0, 12),
    }))
    .filter((group) => group.items.length > 0);

  if (loading) return <SearchLoading />;

  if (isSearching && items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-8 text-center animate-in fade-in duration-200">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
          <BookOpen className="h-6 w-6 opacity-30" />
        </div>
        <h4 className="text-sm font-bold text-white">This series does not exist</h4>
        <p className="mt-1 text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
          No series matching &ldquo;<span className="text-purple-300 font-semibold">{displayQuery}</span>&rdquo; was found in our library.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <Link
            to="/request-series"
            search={displayQuery ? { title: displayQuery } : undefined}
            onClick={() => onClose?.()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/60 transition cursor-pointer"
          >
            <span>Request This Series</span>
          </Link>
          <Link
            to="/browse"
            search={displayQuery ? { search: displayQuery } : undefined}
            onClick={() => onClose?.()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 transition cursor-pointer"
          >
            <span>Browse All</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return <SearchEmpty message="No comics available yet." />;
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <section key={group.type} className="space-y-2">
          <div className="flex items-center gap-2">
            {isSearching ? (
              <Badge className="h-5 rounded bg-purple-600/30 border border-purple-500/40 px-1.5 text-[10px] font-bold uppercase text-purple-300 hover:bg-purple-600/30">
                Matching
              </Badge>
            ) : (
              <Badge className="h-5 rounded bg-zinc-600 px-1.5 text-[10px] font-bold uppercase text-white hover:bg-zinc-600">
                Hot
              </Badge>
            )}
            <h3 className="text-xs font-bold text-zinc-200">
              {seriesTypeLabels[group.type] ?? group.type}
            </h3>
            {isSearching && (
              <span className="text-[10px] text-muted-foreground font-mono">
                ({group.items.length})
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {group.items.map((series) => (
              <button
                key={series.id}
                type="button"
                onClick={() => onSelect(series.slug)}
                title={series.title}
                className="group relative min-w-0 text-left cursor-pointer"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded bg-neutral-950 ring-1 ring-neutral-800 transition duration-200 group-hover:ring-purple-500/70 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                  {series.cover_url ? (
                    series.cover_url.toLowerCase().split("?")[0].endsWith(".mp4") ? (
                      <video
                        src={series.cover_url}
                        loop
                        muted
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={series.cover_url}
                        alt={series.title}
                        width={200}
                        height={300}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    )
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  )}

                  {/* Default bottom title banner */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-1.5 transition-opacity group-hover:opacity-0 pointer-events-none">
                    <p className="line-clamp-2 text-[10px] font-bold leading-tight text-white">
                      {series.title}
                    </p>
                  </div>

                  {/* Full Series Name Reveal On Hover */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black via-black/95 to-black/30 p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                    <p className="text-[11px] font-bold leading-tight text-white break-words drop-shadow-md">
                      {series.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-purple-300 font-semibold uppercase">
                      <span>{series.type}</span>
                      {series.rating_average && Number(series.rating_average) > 0 && (
                        <span>• ★{Number(series.rating_average).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function UserSearchPanel({
  query,
  loading,
  items,
  onSelect,
}: {
  query: string;
  loading: boolean;
  items: any[];
  onSelect: (username: string) => void;
}) {
  if (query.trim().length < 2) {
    return <SearchEmpty message="Type at least 2 characters to search users." />;
  }
  if (loading) return <SearchLoading />;
  if (items.length === 0) {
    return <SearchEmpty message={`No users found for "${query}".`} />;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((userMember) => (
        <button
          key={userMember.username}
          type="button"
          onClick={() => onSelect(userMember.username)}
          className="flex items-center gap-3 rounded bg-neutral-900 border border-neutral-850 p-3 text-left transition hover:bg-neutral-800"
        >
          {userMember.avatar_url ? (
            <img
              src={userMember.avatar_url}
              alt={userMember.username}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded border border-neutral-850 bg-neutral-950 text-xs font-mono font-bold text-neutral-300">
              {userMember.username?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{userMember.username}</p>
            <p className="text-xs text-muted-foreground">View profile</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function GroupSearchPanel({
  query,
  loading,
  items,
  onSelect,
}: {
  query: string;
  loading: boolean;
  items: string[];
  onSelect: (groupName: string) => void;
}) {
  if (query.trim().length < 2) {
    return <SearchEmpty message="Type at least 2 characters to search groups." />;
  }
  if (loading) return <SearchLoading />;
  if (items.length === 0) {
    return <SearchEmpty message={`No groups found for "${query}".`} />;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((group) => (
        <button
          key={group}
          type="button"
          onClick={() => onSelect(group)}
          className="flex items-center gap-3 rounded bg-neutral-900 border border-neutral-850 p-3 text-left transition hover:bg-neutral-800"
        >
          <div className="grid h-10 w-10 place-items-center rounded border border-neutral-850 bg-neutral-950 text-neutral-400">
            <Users className="h-4 w-4 stroke-[1.5]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{group}</p>
            <p className="text-xs text-muted-foreground">Open group titles</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-xs font-bold uppercase tracking-wider text-neutral-500">
      <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
      Searching...
    </div>
  );
}

function SearchEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border/70 bg-[#19191d] px-4 py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
