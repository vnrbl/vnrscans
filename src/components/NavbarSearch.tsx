import { useState, useEffect } from "react";
import { Search, BookOpen, User as UserIcon, Users, Loader2, X } from "lucide-react";
import { useNavigate } from "@/lib/router-compat";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchTab, setActiveSearchTab] = useState<SearchTab>("comics");
  const [searching, setSearching] = useState(false);
  const [seriesResults, setSeriesResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [groupResults, setGroupResults] = useState<string[]>([]);
  const navigate = useNavigate();

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

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      const prepared = prepareSearchInput(searchQuery);
      const q = prepared.primaryTerm;
      if (q.length >= 2) {
        setSearching(true);
        try {
          const seriesFilter = buildSeriesSearchOrFilter(prepared.terms);
          const [seriesRes, usersRes, groupsRes] = await Promise.all([
            supabase
              .from("series")
              .select("id,slug,title,alternative_titles,cover_url,type,rating_average,author,artist,description,view_count,is_trending")
              .eq("is_hidden", false)
              .or(seriesFilter)
              .limit(48),
            supabase
              .from("profiles")
              .select("username,avatar_url")
              .ilike("username", `%${q}%`)
              .limit(12),
            supabase
              .from("chapters")
              .select("scanlation_group")
              .ilike("scanlation_group", `%${q}%`)
              .not("scanlation_group", "is", null)
              .limit(30),
          ]);
          if (seriesRes.data) setSeriesResults(rankSeriesResults(seriesRes.data, prepared).slice(0, 24));
          if (usersRes.data) setUserResults(usersRes.data);
          if (groupsRes.data) {
            const uniqueGroups = Array.from(
              new Set(groupsRes.data.map((c: any) => c.scanlation_group).filter(Boolean))
            ) as string[];
            setGroupResults(uniqueGroups.slice(0, 12));
          }
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setSearching(false);
        }
      } else {
        setSeriesResults([]);
        setUserResults([]);
        setGroupResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
                autoFocus
                placeholder="Search manga by title, author or synopsis..."
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
}: {
  query: string;
  loading: boolean;
  items: any[];
  onSelect: (slug: string) => void;
}) {
  const displayQuery = getSearchDisplayTerm(query);
  const grouped = readingTypeOrder
    .map((type) => ({
      type,
      items: items.filter((item) => item.type === type).slice(0, 6),
    }))
    .filter((group) => group.items.length > 0);

  if (loading) return <SearchLoading />;

  if (query.trim().length >= 2 && items.length === 0) {
    return <SearchEmpty message={`No comics found for "${displayQuery}".`} />;
  }

  if (!loading && items.length === 0) {
    return <SearchEmpty message="No comics available yet." />;
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <section key={group.type} className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="h-5 rounded bg-zinc-600 px-1.5 text-[10px] font-bold uppercase text-white hover:bg-zinc-600">
              Hot
            </Badge>
            <h3 className="text-xs font-bold text-zinc-200">
              {seriesTypeLabels[group.type] ?? group.type}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {group.items.map((series) => (
              <button
                key={series.id}
                type="button"
                onClick={() => onSelect(series.slug)}
                className="group min-w-0 text-left"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded bg-neutral-950 ring-1 ring-neutral-800 transition group-hover:ring-neutral-500">
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
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-1.5">
                    <p className="line-clamp-2 text-[10px] font-bold leading-tight text-white">
                      {series.title}
                    </p>
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
