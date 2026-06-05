import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, Search, BookOpen, User as UserIcon, LogOut, ShieldCheck, Library, Home, Sparkles, Trophy, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Loader2, Users } from "lucide-react";
import { DiceRollOverlay, type DiceSeries } from "@/components/DiceRollOverlay";
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
  const [diceOpen, setDiceOpen] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceSeries, setDiceSeries] = useState<DiceSeries[]>([]);
  const [navDiceFace, setNavDiceFace] = useState(6);

  // Cycle dice face icon in navbar button while rolling
  useEffect(() => {
    if (!isRolling) return;
    let delay = 80;
    let t: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setNavDiceFace((f) => (f % 6) + 1);
      delay = Math.min(delay + 12, 320);
      t = setTimeout(cycle, delay);
    };
    t = setTimeout(cycle, delay);
    return () => clearTimeout(t);
  }, [isRolling]);

  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const showPanel = isAdmin || isMod || isUploader;

  let panelLabel = "Admin Panel";
  if (isAdmin) panelLabel = "Admin Panel";
  else if (isMod) panelLabel = "Moderator Panel";
  else if (isUploader) panelLabel = "Uploader Panel";

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

  const userStats = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_level,reading_streak,is_vip,experience_points,avatar_url,avatar_frame,accent_color,username")
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

  // ─── Dice-powered random series ───────────────────────────────────────────
  const handleRandom = async () => {
    if (isRolling) return;
    // Determine dice result up-front so animation CSS can target the right face
    const roll = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    setDiceResult(roll);
    setDiceSeries([]);
    setDiceOpen(true);
    setIsRolling(true);

    const { data, error } = await supabase
      .from("series")
      .select("id,slug,title,cover_url,type")
      .eq("is_hidden", false)
      .limit(500);

    if (!error && data && data.length > 0) {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setDiceSeries(shuffled.slice(0, 6) as DiceSeries[]);
    }
    setTimeout(() => setIsRolling(false), 3000);
  };

  const handleDiceNavigate = (slug: string) => {
    setDiceOpen(false);
    setDiceResult(null);
    setDiceSeries([]);
    navigate({ to: "/title/$slug", params: { slug } });
  };

  const handleDiceClose = () => {
    setDiceOpen(false);
    setDiceResult(null);
    setDiceSeries([]);
    setIsRolling(false);
  };

  // ─── Search with debounce ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = searchQuery.trim();
      if (q.length >= 2) {
        setSearching(true);
        try {
          const [seriesRes, usersRes, groupsRes] = await Promise.all([
            supabase
              .from("series")
              .select("id,slug,title,cover_url,type,rating_average,author,description,view_count,is_trending")
              .eq("is_hidden", false)
              .or(`title.ilike.%${q}%,alternative_titles.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%`)
              .limit(24),
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

  // Ctrl+K shortcut
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
      <div className="container mx-auto flex h-16 items-center px-8 md:px-12 lg:px-16 relative">
        {/* Logo */}
        <div className="flex-1 flex items-center justify-start">
          <Link to="/home" className="flex shrink-0 items-center gap-2 transition-transform hover:scale-105">
            <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">VS</span>
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-primary sm:inline">
              vnrscans
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-1 absolute left-1/2 -translate-x-1/2">
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
        <div className="flex-1 flex items-center justify-end gap-2">
          {/* Search Button (desktop) */}
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

          {/* Random Button (desktop) */}
          {(() => {
            const DiceIcon = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][navDiceFace - 1];
            return (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRandom}
                disabled={isRolling}
                className="hidden sm:flex"
                title="Random Series"
              >
                <DiceIcon className={`h-5 w-5 transition-all ${isRolling ? "text-primary scale-110" : ""}`} />
              </Button>
            );
          })()}

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

              {/* Mobile Dice Roll Icon */}
              {(() => {
                const DiceIcon = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][navDiceFace - 1];
                return (
                  <button
                    className="flex sm:hidden items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
                    onClick={handleRandom}
                    disabled={isRolling}
                    aria-label="Roll Random"
                  >
                    <DiceIcon className={`h-5 w-5 transition-all ${isRolling ? "text-primary scale-110" : ""}`} />
                  </button>
                );
              })()}

              {/* Notifications Bell */}
              <NotificationBell />

              {/* User Dropdown with Stats */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 transition-all hover:bg-transparent hover:scale-105 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <NavbarAvatarFrame 
                      avatarUrl={userStats.data?.avatar_url}
                      avatarFrame={userStats.data?.avatar_frame || 'none'}
                      accentColor={userStats.data?.accent_color || '#8B5CF6'}
                      username={userStats.data?.username}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {userStats.data && (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            {isAdmin ? "Maxed Out" : `Level ${userStats.data.user_level}`}
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
                              style={{ width: isAdmin ? "100%" : `${((userStats.data.experience_points % 100) / 100) * 100}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs">
                            {isAdmin
                              ? "Infinite Aura and XP"
                              : `${userStats.data.experience_points % 100}/100 XP to Level ${userStats.data.user_level + 1}`}
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
              <Button size="sm">Sign In</Button>
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
          <nav className="container mx-auto flex flex-col items-center px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full max-w-[200px] rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Dice Roll Overlay */}
      <DiceRollOverlay
        open={diceOpen}
        diceResult={diceResult}
        series={diceSeries}
        onClose={handleDiceClose}
        onNavigate={handleDiceNavigate}
        onRollAgain={() => { handleDiceClose(); setTimeout(handleRandom, 50); }}
      />
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

/* ─── Navbar Mini Avatar with Frame ─── */
const navFrameKeyframes = `
@keyframes navRotCW { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes navRotCCW { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
@keyframes navPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes navGlitch { 0%,100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(30deg); } }
`;

let navFrameStylesInjected = false;

function NavbarAvatarFrame({ 
  avatarUrl, 
  avatarFrame, 
  accentColor, 
  username 
}: { 
  avatarUrl?: string | null; 
  avatarFrame: string; 
  accentColor: string; 
  username?: string | null; 
}) {
  // Inject keyframes once
  if (!navFrameStylesInjected && typeof document !== 'undefined') {
    const style = document.createElement("style");
    style.textContent = navFrameKeyframes;
    document.head.appendChild(style);
    navFrameStylesInjected = true;
  }

  const size = 36; // px
  const borderWidth = 2; // px
  const innerSize = size - borderWidth * 2;

  const getFrameGradient = () => {
    switch (avatarFrame) {
      case "neon": return "conic-gradient(from 0deg, #A855F7, #06B6D4, #EC4899, #A855F7)";
      case "gold": return "conic-gradient(from 0deg, #a67c00, #ffd700, #ffeb99, #ffd700, #a67c00)";
      case "cyber": return "conic-gradient(from 0deg, #0ea5e9, transparent 30%, #c084fc, transparent 60%, #0ea5e9)";
      case "fire": return "conic-gradient(from 0deg, #b91c1c, #f97316, #ef4444, #b91c1c)";
      case "sakura": return "conic-gradient(from 0deg, #FDA4AF, #F472B6, #E879F9, #FDA4AF)";
      case "shadow": return "conic-gradient(from 0deg, #4f46e5, #06b6d4, #1e1b4b, #4f46e5)";
      case "qi": return "conic-gradient(from 0deg, #059669, #10B981, #FBBF24, #059669)";
      case "asura": return "conic-gradient(from 0deg, #ef4444, #7f1d1d, #ef4444)";
      case "system": return "conic-gradient(from 0deg, #06B6D4, transparent 30%, #06B6D4 50%, transparent 70%, #06B6D4)";
      default: return accentColor;
    }
  };

  const getFrameGlow = () => {
    switch (avatarFrame) {
      case "neon": return "0 0 8px rgba(168,85,247,0.5), 0 0 16px rgba(6,182,212,0.3)";
      case "gold": return "0 0 8px rgba(255,215,0,0.5), 0 0 14px rgba(255,215,0,0.25)";
      case "cyber": return "0 0 8px rgba(6,182,212,0.5), 0 0 14px rgba(192,132,252,0.25)";
      case "fire": return "0 0 10px rgba(239,68,68,0.6), 0 0 16px rgba(249,115,22,0.3)";
      case "sakura": return "0 0 8px rgba(244,114,182,0.5), 0 0 14px rgba(233,121,249,0.25)";
      case "shadow": return "0 0 10px rgba(99,102,241,0.6), 0 0 16px rgba(6,182,212,0.2)";
      case "qi": return "0 0 8px rgba(16,185,129,0.5), 0 0 14px rgba(251,191,36,0.25)";
      case "asura": return "0 0 10px rgba(239,68,68,0.7), 0 0 18px rgba(127,29,29,0.4)";
      case "system": return "0 0 8px rgba(6,182,212,0.6), 0 0 14px rgba(6,182,212,0.3)";
      default: return `0 0 6px ${accentColor}40`;
    }
  };

  const isAnimated = avatarFrame !== "none";
  const animSpeed = avatarFrame === "fire" ? "1.5s" : avatarFrame === "neon" ? "2s" : "3s";

  return (
    <div
      className="relative rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
      style={{ 
        width: size, 
        height: size,
        boxShadow: getFrameGlow(),
      }}
    >
      {/* Rotating frame border */}
      {isAnimated && (
        <div 
          className="absolute inset-0 rounded-full" 
          style={{ 
            background: getFrameGradient(),
            animation: `navRotCW ${animSpeed} linear infinite`,
          }} 
        />
      )}
      {/* Static frame border for "none" */}
      {!isAnimated && (
        <div 
          className="absolute inset-0 rounded-full" 
          style={{ background: accentColor }} 
        />
      )}
      {/* Inner background mask */}
      <div 
        className="absolute rounded-full bg-background" 
        style={{ 
          inset: borderWidth,
        }} 
      />
      {/* Avatar image or initial */}
      <div 
        className="relative rounded-full overflow-hidden flex items-center justify-center bg-background z-10"
        style={{ 
          width: innerSize, 
          height: innerSize,
          animation: isAnimated ? `navPulse 4s ease-in-out infinite` : undefined,
        }}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={username || "Profile"} 
            className="h-full w-full object-cover rounded-full"
          />
        ) : (
          <div 
            className="h-full w-full flex items-center justify-center rounded-full text-[11px] font-bold"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
              color: accentColor,
            }}
          >
            {username?.charAt(0)?.toUpperCase() || <UserIcon className="h-4 w-4" />}
          </div>
        )}
      </div>

      {/* Cyber brackets overlay */}
      {avatarFrame === "cyber" && (
        <div className="absolute inset-[-1px] pointer-events-none z-20" style={{ animation: 'navGlitch 6s infinite' }}>
          <div className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-cyan-400 rounded-tl-sm" style={{ boxShadow: '0 0 3px cyan' }} />
          <div className="absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-cyan-400 rounded-tr-sm" style={{ boxShadow: '0 0 3px cyan' }} />
          <div className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-cyan-400 rounded-bl-sm" style={{ boxShadow: '0 0 3px cyan' }} />
          <div className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-cyan-400 rounded-br-sm" style={{ boxShadow: '0 0 3px cyan' }} />
        </div>
      )}

      {/* System S-RANK mini badge */}
      {avatarFrame === "system" && (
        <div className="absolute -top-1 -right-1 z-30 bg-slate-950 border border-cyan-400 text-cyan-400 text-[5px] font-black px-0.5 rounded leading-tight" style={{ boxShadow: '0 0 4px rgba(6,182,212,0.7)' }}>
          S
        </div>
      )}

      {/* Fire ember dot */}
      {avatarFrame === "fire" && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500 z-20 animate-pulse" style={{ boxShadow: '0 0 4px #ef4444' }} />
      )}

      {/* Gold crown tiny */}
      {avatarFrame === "gold" && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-400 z-20" style={{ fontSize: '8px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
          👑
        </div>
      )}
    </div>
  );
}
