import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, Search, BookOpen, User as UserIcon, LogOut, ShieldCheck, Library, TrendingUp, Home, Sparkles, Trophy, Shuffle, Tag, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [seriesResults, setSeriesResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [groupResults, setGroupResults] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const router = useRouter();

  const links = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/browse", label: "Browse", icon: BookOpen },
    { to: "/rankings", label: "Rankings", icon: Trophy },
    { to: "/recommendations", label: "For You", icon: Sparkles },
  ];

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
              .select("id,slug,title,cover_url,type,rating_average")
              .or(`title.ilike.%${q}%,alternative_titles.ilike.%${q}%`)
              .limit(5),
            
            // 2. Search users (profiles)
            supabase
              .from("profiles")
              .select("username,avatar_url")
              .ilike("username", `%${q}%`)
              .limit(5),

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
            setGroupResults(uniqueGroups.slice(0, 5));
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
            className="hidden sm:flex"
            title="Random Series"
          >
            <Shuffle className={`h-5 w-5 transition-transform ${isRolling ? 'animate-spin' : ''}`} />
          </Button>

          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex"
            title="Search (Ctrl+K)"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Command Palette Dialog */}
          <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
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
          </CommandDialog>

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
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin" })} className="text-primary">
                        <ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel
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
            {/* Mobile Search */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setOpen(false);
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              Search
            </button>

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