import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, Search, BookOpen, User as UserIcon, LogOut, ShieldCheck, Library, TrendingUp, Home, Settings, Sparkles, Trophy, Shuffle, Tag } from "lucide-react";
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

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
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
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const { data, error } = await supabase
            .from("series")
            .select("id,slug,title,cover_url,type,rating_average")
            .or(`title.ilike.%${searchQuery}%,alternative_titles.ilike.%${searchQuery}%`)
            .limit(8);
          
          if (!error && data) {
            setSearchResults(data);
          }
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
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
    setSearchResults([]);
    navigate({ to: "/title/$slug", params: { slug } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-8 md:px-12 lg:px-16">
        {/* Logo */}
        <Link to="/home" className="flex shrink-0 items-center gap-2 transition-transform hover:scale-105">
          <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">0V</span>
          </div>
          <span className="hidden text-xl font-bold tracking-tight text-primary sm:inline">
            0Verse
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

          {/* Search */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex" title="Search (Ctrl+K)">
                <Search className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Search Series</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                
                {searching && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
                
                {!searching && searchResults.length > 0 && (
                  <div className="max-h-[400px] space-y-2 overflow-y-auto">
                    {searchResults.map((series) => (
                      <button
                        key={series.id}
                        onClick={() => handleSearchSelect(series.slug)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border/40 bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary"
                      >
                        {series.cover_url ? (
                          <img
                            src={series.cover_url}
                            alt={series.title}
                            className="h-16 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-12 items-center justify-center rounded bg-secondary">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold">{series.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="uppercase">{series.type}</span>
                            {series.rating_average && (
                              <>
                                <span>•</span>
                                <span>★ {Number(series.rating_average).toFixed(1)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
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
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
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