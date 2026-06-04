import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, Search, BookOpen, User as UserIcon, LogOut, ShieldCheck, Library, TrendingUp, Home, Sparkles, Trophy, Shuffle, Tag, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

type SearchTab = "comics" | "users" | "groups";

const seriesTypeLabels: Record<string, string> = {
  manga: "Manga",
  manhwa: "Manhwa",
  manhua: "Manhua",
  novel: "Novels",
};

const readingTypeOrder = ["manga", "manhwa", "manhua", "novel"];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchTab, setActiveSearchTab] = useState<SearchTab>("comics");
  const [searching, setSearching] = useState(false);
  const [seriesResults, setSeriesResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [groupResults, setGroupResults] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const showPanel = isAdmin || isMod || isUploader;
  
  let panelLabel = "Admin Panel";
  if (isAdmin) {
    panelLabel = "Admin Panel";
  } else if (isMod) {
    panelLabel = "Moderator Panel";
  } else if (isUploader) {
    panelLabel = "Uploader Panel";
  }

  const navigate = useNavigate();
  const router = useRouter();

  const links = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/browse", label: "Browse", icon: BookOpen },
    { to: "/rankings", label: "Rankings", icon: Trophy },
    { to: "/recommendations", label: "For You", icon: Sparkles },
  ];

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
    enabled: searchOpen,
    staleTime: 10 * 60 * 1000,
  });

  // Get user stats
  const userStats = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_level,reading_streak,is_vip,experience_points")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  // Random series function with dice animation
  const handleRandom = async () => {
    setIsRolling(true);
    
    const { data, error } = await supabase
      .from("series")
      .select("slug")
      .order("id")
      .limit(1000);
    
    // Wait for animation to complete (1 second)
    setTimeout(() => {
      setIsRolling(false);
      if (!error && data && data.length > 0) {
        const randomSeries = data[Math.floor(Math.random() * data.length)];
        navigate({ to: "/title/$slug", params: { slug: randomSeries.slug } });
      }
    }, 1000);
  };

  // Search functionality with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = searchQuery.trim();
      if (q.length >= 2) {
        setSearching(true);
        try {
          const [seriesRes, usersRes, groupsRes] = await Promise.all([
            // 1. Search series (titles)
            supabase
              .from("series")
              .select("id,slug,title,cover_url,type,rating_average,author,description,view_count,is_trending")
              .eq("is_hidden", false)
              .or(`title.ilike.%${q}%,alternative_titles.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%`)
              .limit(24),
            
            // 2. Search users (profiles)
            supabase
              .from("profiles")
              .select("username,avatar_url")
              .ilike("username", `%${q}%`)
              .limit(12),

            // 3. Search scanlation groups from chapters table
            supabase
              .from("chapters")
              .select("scanlation_group")
              .ilike("scanlation_group", `%${q}%`)
              .not("scanlation_group", "is", null)
              .limit(30)
          ]);

          if (seriesRes.data) setSeriesResults(seriesRes.data);
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

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSelect = (slug: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSeriesResults([]);
    setUserResults([]);
    setGroupResults([]);
    navigate({ to: "/title/$slug", params: { slug } });
  };

  const handleUserSelect = (username: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSeriesResults([]);
    setUserResults([]);
    setGroupResults([]);
    navigate({ to: "/user/$username", params: { username } });
  };

  const handleGroupSelect = (groupName: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSeriesResults([]);
    setUserResults([]);
    setGroupResults([]);
    navigate({ to: "/browse", search: { group: groupName } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-8 md:px-12 lg:px-16">
        {/* Logo */}
        <Link to="/home" className="flex shrink-0 items-center gap-2 transition-transform hover:scale-105">
          <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">VS</span>
          </div>
          <span className="hidden text-xl font-bold tracking-tight text-primary sm:inline">
            vnrscans
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Random Button with Dice Animation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRandom}
            disabled={isRolling}
            className="hidden"
            title="Random Series"
          >
            <Shuffle className={`h-5 w-5 transition-transform ${isRolling ? 'animate-spin' : ''}`} />
          </Button>

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
            className="hidden sm:flex items-center gap-2 min-w-[200px] lg:min-w-[260px] h-9 rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm text-muted-foreground transition-all hover:border-border hover:bg-secondary hover:text-foreground focus:outline-none"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left truncate">Search titles, authors…</span>
            <kbd className="hidden lg:inline-flex items-center rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Ctrl K
            </kbd>
          </button>

          {/* Random Button with Dice Animation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRandom}
            disabled={isRolling}
            className="hidden sm:flex"
            title="Random Series"
          >
            <Shuffle className={`h-5 w-5 transition-transform ${isRolling ? 'animate-spin' : ''}`} />
          </Button>

          {/* Search Dialog */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogContent className="top-[12vh] max-h-[78vh] w-[calc(100vw-1.5rem)] max-w-[620px] translate-y-0 overflow-hidden rounded-md border-border/70 bg-[#202024] p-0 shadow-2xl sm:top-[14vh] [&>button]:hidden">
              <div className="border-b border-border/60 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-red-500/70 bg-[#151519] px-3 shadow-[0_0_0_1px_rgba(239,68,68,0.08)] focus-within:border-red-500 focus-within:shadow-[0_0_0_1px_rgba(239,68,68,0.35)]">
                    <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      autoFocus
                      placeholder="Search manga by title, author or synopsis..."
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    {searching && <Loader2 className="h-4 w-4 animate-spin text-red-500" />}
                  </div>
                  <kbd className="hidden rounded border border-border bg-[#2b2b31] px-2 py-1 text-[10px] font-semibold text-muted-foreground sm:inline-flex">
                    ESC
                  </kbd>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="border-b border-border/50 p-3">
                <div className="grid h-9 grid-cols-3 gap-2 rounded-md bg-[#17171b] p-1">
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

          {/* Command Palette Dialog */}
          {false && <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
            <CommandInput
              placeholder="Search titles, users, or groups..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {searching && (
                <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Searching...
                </div>
              )}

              {!searching && searchQuery.length >= 2 && seriesResults.length === 0 && userResults.length === 0 && groupResults.length === 0 && (
                <CommandEmpty>No results found for "{searchQuery}".</CommandEmpty>
              )}

              {/* Series Group */}
              {seriesResults.length > 0 && (
                <CommandGroup heading="Manga & Novels">
                  {seriesResults.map((series) => (
                    <CommandItem
                      key={series.id}
                      value={`${series.title} series`}
                      onSelect={() => handleSearchSelect(series.slug)}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary"
                    >
                      {series.cover_url ? (
                        <img
                          src={series.cover_url}
                          alt={series.title}
                          className="h-10 w-7.5 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-7.5 items-center justify-center rounded bg-secondary flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-xs text-foreground">{series.title}</div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="uppercase">{series.type}</span>
                          {series.rating_average && (
                            <>
                              <span>•</span>
                              <span>★ {Number(series.rating_average).toFixed(1)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Users Group */}
              {userResults.length > 0 && (
                <CommandGroup heading="Community Members">
                  {userResults.map((userMember) => (
                    <CommandItem
                      key={userMember.username}
                      value={`${userMember.username} user`}
                      onSelect={() => handleUserSelect(userMember.username)}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary"
                    >
                      {userMember.avatar_url ? (
                        <img
                          src={userMember.avatar_url}
                          alt={userMember.username}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary flex-shrink-0 text-2xs font-bold text-foreground">
                          {userMember.username?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-xs text-foreground">{userMember.username}</div>
                        <div className="text-[10px] text-muted-foreground">View profile</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Groups Group */}
              {groupResults.length > 0 && (
                <CommandGroup heading="Scanlation Teams">
                  {groupResults.map((group) => (
                    <CommandItem
                      key={group}
                      value={`${group} group`}
                      onSelect={() => handleGroupSelect(group)}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary"
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600/10 text-primary flex-shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-xs text-foreground">{group}</div>
                        <div className="text-[10px] text-muted-foreground">Scanlation Group</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </CommandDialog>}

          {/* User Menu */}
          {user ? (
            <>
              {/* Library Quick Access (Desktop) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: "/library" })}
                className="hidden md:flex"
                title="My Library"
              >
                <Library className="h-5 w-5" />
              </Button>

              {/* Mobile Search Icon (left of notifications) */}
              <button
                className="flex sm:hidden items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Notifications Bell */}
              <NotificationBell />

              {/* User Dropdown with Stats */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full transition-all hover:bg-primary/10">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {userStats.data && (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Level {userStats.data.user_level}
                            {userStats.data.is_vip && <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">VIP</Badge>}
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-normal text-muted-foreground">
                          <div className="flex items-center gap-1">
                            🔥 Streak: {userStats.data.reading_streak} days
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div 
                              className="h-full bg-gradient-to-r from-violet-600 to-purple-600"
                              style={{ 
                                width: `${((userStats.data.experience_points % 100) / 100) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="mt-1 text-xs">
                            {userStats.data.experience_points % 100}/100 XP to Level {userStats.data.user_level + 1}
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    <UserIcon className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  {showPanel && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin" })} className="text-primary">
                        <ShieldCheck className="mr-2 h-4 w-4" /> {panelLabel}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t border-border/50 md:hidden">
          <nav className="container mx-auto flex flex-col px-4 py-2">
            {/* Mobile Random */}
            <button
              onClick={() => {
                handleRandom();
                setOpen(false);
              }}
              disabled={isRolling}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <Shuffle className={`h-4 w-4 transition-transform ${isRolling ? 'animate-spin' : ''}`} />
              Random Series
            </button>
            
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
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
      className={`flex min-w-0 items-center justify-center gap-2 rounded-md px-2 text-xs font-semibold transition ${
        active
          ? "bg-red-600 text-white shadow-[0_8px_20px_rgba(220,38,38,0.25)]"
          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
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
  const grouped = readingTypeOrder
    .map((type) => ({
      type,
      items: items.filter((item) => item.type === type).slice(0, 6),
    }))
    .filter((group) => group.items.length > 0);

  if (loading) return <SearchLoading />;

  if (query.trim().length >= 2 && items.length === 0) {
    return <SearchEmpty message={`No comics found for "${query}".`} />;
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
                <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-[#151519] shadow-sm ring-1 ring-border/40 transition group-hover:ring-red-500/70">
                  {series.cover_url ? (
                    <img
                      src={series.cover_url}
                      alt={series.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
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
          className="flex items-center gap-3 rounded-md bg-[#19191d] p-3 text-left transition hover:bg-[#24242a]"
        >
          {userMember.avatar_url ? (
            <img
              src={userMember.avatar_url}
              alt={userMember.username}
              className="h-10 w-10 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/15 text-sm font-bold text-red-300">
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
          className="flex items-center gap-3 rounded-md bg-[#19191d] p-3 text-left transition hover:bg-[#24242a]"
        >
          <div className="grid h-10 w-10 place-items-center rounded-md bg-red-500/15 text-red-300">
            <Users className="h-4 w-4" />
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
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
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
