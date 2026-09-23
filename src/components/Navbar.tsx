import { Link, useNavigate } from "@/lib/router-compat";
import { useState, useEffect, lazy, Suspense } from "react";
import { Menu, X, Search, BookOpen, User as UserIcon, LogOut, ShieldCheck, ShieldAlert, Library, Home, Sparkles, Trophy, Crown, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Loader2, Users, Settings as SettingsIcon, Plus, UserRoundPlus } from "lucide-react";
import type { DiceSeries } from "@/components/DiceRollOverlay";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import dynamic from "next/dynamic";
const AddNewSeriesDialog = dynamic(
  () => import("@/components/admin/AddNewSeriesDialog").then((m) => m.AddNewSeriesDialog),
  { ssr: false }
);

const DiceRollOverlay = lazy(() => import("@/components/DiceRollOverlay").then(m => ({ default: m.DiceRollOverlay })));
const NavbarSearch = lazy(() => import("@/components/NavbarSearch").then(m => ({ default: m.NavbarSearch })));
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SpotlightNavbar } from "@/components/ui/spotlight-navbar";
import { GlassDock } from "@/components/ui/glass-dock";
import { AwwwardsNav } from "@/components/ui/awwwards-nav";
const NotificationBell = lazy(() => import("@/components/notifications/NotificationBell").then(m => ({ default: m.NotificationBell })));


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
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceSeries, setDiceSeries] = useState<DiceSeries[]>([]);
  const [navDiceFace, setNavDiceFace] = useState(6);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key closes menu drawer
  useEffect(() => {
    if (!menuDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuDrawerOpen]);

  // Ctrl+K / ⌘K hotkey toggles search console (single canonical listener)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Clean up any residual performance mode classes from html
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove("perf-mode", "eco-mode", "reader-turbo", "data-saver", "gpu-accel");
      ["vnr-perf-master", "vnr-perf-shaders", "vnr-perf-eco", "vnr-perf-reader-turbo", "vnr-perf-data-saver", "vnr-perf-gpu", "vnr-perf-fps-hud"].forEach((k) => localStorage.removeItem(k));
    } catch (_) {}
  }, []);

  const { user, isGuest } = useAuth();
  const { settings } = useReaderSettings();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const showPanel = mounted && (isAdmin || isMod || isUploader);

  let panelLabel = "Admin Panel";
  if (isAdmin) panelLabel = "Admin Panel";
  else if (isMod) panelLabel = "Moderator Panel";
  else if (isUploader) panelLabel = "Uploader Panel";

  const navigate = useNavigate();

  const links = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/browse", label: "Browse", icon: BookOpen },
    { to: "/rankings", label: "Rankings", icon: Trophy },
    { to: "/leaderboard", label: "Leaderboard", icon: Crown },
    { to: "/recommendations", label: "For You", icon: Sparkles },
    { to: "/novels", label: "Novels", icon: BookOpen },
  ];

  const spotlightItems = [
    { label: "Home", href: "/home" },
    { label: "Browse", href: "/browse" },
    { label: "Rankings", href: "/rankings" },
    { label: "Novels", href: "/novels" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  const dockItems = [
    { title: "Home", icon: Home, onClick: () => navigate({ to: "/home" }) },
    { title: "Browse", icon: BookOpen, onClick: () => navigate({ to: "/browse" }) },
    { title: "Rankings", icon: Trophy, onClick: () => navigate({ to: "/rankings" }) },
    { title: "Random", icon: Dice5, onClick: () => handleRandom() },
    { title: "Search", icon: Search, onClick: () => setSearchOpen(true) },
    { title: "Library", icon: Library, onClick: () => navigate({ to: "/library" }) },
    { title: "Settings", icon: SettingsIcon, onClick: () => navigate({ to: "/settings" }) },
  ];

  const awwwardsItems = [
    { label: "Home", href: "/home" },
    { label: "Browse", href: "/browse" },
    { label: "Rankings", href: "/rankings" },
    { label: "Novels", href: "/novels" },
  ];

  const awwwardsColumns = [
    {
      title: "Explore",
      links: [
        { label: "Home", href: "/home" },
        { label: "Browse Catalog", href: "/browse" },
        { label: "Rankings", href: "/rankings" },
        { label: "Leaderboard", href: "/leaderboard" },
        { label: "Light Novels", href: "/novels" },
      ],
    },
    {
      title: "Categories",
      links: [
        { label: "Manga", href: "/browse?type=manga" },
        { label: "Manhwa", href: "/browse?type=manhwa" },
        { label: "Manhua", href: "/browse?type=manhua" },
        { label: "Novels", href: "/browse?type=novel" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "My Library", href: "/library" },
        { label: "Profile", href: "/profile" },
        { label: "Settings", href: "/settings" },
        ...(showPanel ? [{ label: panelLabel, href: "/admin" }] : []),
      ],
    },
  ];



  const userStats = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_level,reading_streak,is_vip,experience_points,avatar_url,avatar_frame,accent_color,username")
        .eq("user_id", user.id)
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
      .limit(24);

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

  return (
    <>
      <header className="sticky top-0 z-50 navbar-ios-glass">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative justify-between">
          {/* Left Side: YouTube-Style Menu Toggle + Logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuDrawerOpen((prev) => !prev)}
              className="focus-ring h-9 w-9 text-foreground hover:bg-secondary/60 transition-colors cursor-pointer select-none active:scale-95"
              title={menuDrawerOpen ? "Close Menu" : "Menu"}
              aria-label={menuDrawerOpen ? "Close Menu" : "Open Menu"}
              aria-expanded={menuDrawerOpen}
            >
              {menuDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link to="/home" className="flex shrink-0 items-center gap-2 transition-transform hover:scale-105">
              <img src="/favicon.svg" alt="vnrscans logo" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
              <span className="font-black text-sm sm:text-base tracking-wider text-white uppercase font-sans leading-none">
                VNR SCANS
              </span>
            </Link>

            {/* + SVG Icon Button for Add New Series on the right side of Logo (Desktop only, mobile has it in bottom navbar) */}
            {showPanel && (
              <div className="hidden sm:flex items-center">
                <AddNewSeriesDialog
                  trigger={
                    <button
                      type="button"
                      title="Add New Series"
                      aria-label="Add New Series"
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black hover:border-white transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer shrink-0"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  }
                />
              </div>
            )}
          </div>

          {/* Centralized Navigation / Search Bar */}
          {mounted && settings.navbarStyle === "spotlight" ? (
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
              <SpotlightNavbar
                items={spotlightItems}
                onItemClick={(item) => navigate({ to: item.href })}
              />
            </div>
          ) : mounted && settings.navbarStyle === "glass-dock" ? (
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
              <GlassDock
                items={dockItems}
                tooltipPlacement="bottom"
                dockClassName="py-1 px-3 rounded-xl bg-white/[0.04] backdrop-blur-md"
              />
            </div>
          ) : (
            /* Default Centralized Search Bar — visible from lg (was xl: dead space 1024–1279px) */
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
              <button
                onClick={() => setSearchOpen(true)}
                title="Search (Ctrl+K)"
                aria-label="Search titles and authors (Ctrl+K)"
                className="focus-ring flex items-center gap-2.5 w-[240px] lg:w-[240px] xl:w-[320px] h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 px-3 text-xs text-neutral-400 hover:text-white transition-all shadow-sm cursor-pointer"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400 stroke-[1.8]" />
                <span className="flex-1 truncate text-left font-sans font-normal tracking-normal text-neutral-400">
                  Search titles, authors...
                </span>
                <kbd className="inline-flex items-center rounded border border-border/60 bg-neutral-900/80 px-1.5 py-0.5 text-2xs font-mono font-bold text-neutral-400">
                  Ctrl K
                </kbd>
              </button>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Button (Icon for mobile/tablets or when center is occupied by dock/spotlight) */}
            <button
              className={cn(
                "focus-ring items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer active:scale-95",
                !settings.navbarStyle || settings.navbarStyle === "default" ? "flex lg:hidden" : "flex"
              )}
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              title="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Random Button (desktop) */}
            {(() => {
              const DiceIcon = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][navDiceFace - 1];
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRandom}
                  disabled={isRolling}
                  className="hidden sm:flex gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground h-9 px-2.5"
                  title="Random Series"
                >
                  <DiceIcon className={`h-4 w-4 transition-all ${isRolling ? "text-primary scale-110" : ""}`} />
                  <span>Random</span>
                </Button>
              );
            })()}

            {/* Library Quick Access (Desktop) */}
            {mounted && user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/library" })}
                className="hidden lg:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground h-9 px-2.5 relative"
                title="My Library"
              >
                <Library className="h-4 w-4 text-emerald-400" />
                <span>Library</span>
                <span className="flex h-2 w-2 relative ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </Button>
            )}

            {/* Mobile Random Roll Icon */}
            {(() => {
              const DiceIcon = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][navDiceFace - 1];
              return (
                <button
                  className="focus-ring flex sm:hidden items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
                  onClick={handleRandom}
                  disabled={isRolling}
                  aria-label="Roll Random"
                >
                  <DiceIcon className={`h-5 w-5 transition-all ${isRolling ? "text-primary scale-110" : ""}`} />
                </button>
              );
            })()}

            {/* Notifications Bell */}
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>

            {/* User Profile Avatar & Dropdown Menu */}
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 transition-all hover:bg-transparent hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <NavbarAvatarFrame 
                      avatarUrl={userStats.data?.avatar_url}
                      avatarFrame={userStats.data?.avatar_frame || 'none'}
                      accentColor={userStats.data?.accent_color || '#8B5CF6'}
                      username={isGuest ? "Guest" : userStats.data?.username}
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
                            {isAdmin ? "Dao Realm: Lv. ∞" : `Realm: Lv. ${userStats.data.user_level}`}
                            {userStats.data.is_vip && <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">VIP</Badge>}
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-normal text-muted-foreground">
                          <div className="flex items-center gap-1">
                            Dao Heart Streak: {userStats.data.reading_streak} days
                          </div>
                          <div className="mt-1.5 h-1.5 w-full bg-white rounded-none overflow-hidden">
                            <div
                              className="h-full w-full bg-white rounded-none transition-all"
                              style={{ width: "100%" }}
                            />
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                    </>
                  )}
                  {isGuest && (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate({ to: "/auth" })}
                        className="text-primary focus:text-primary"
                      >
                        <UserRoundPlus className="mr-2 h-4 w-4" /> Upgrade to full account
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    <UserIcon className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                    <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  {showPanel && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin" })} className="text-primary">
                        <ShieldCheck className="mr-2 h-4 w-4" /> {panelLabel}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : mounted ? (
              <Button size="sm" onClick={() => navigate({ to: "/auth" })} className="hidden sm:inline-flex">
                Sign In
              </Button>
            ) : (
              <div className="hidden sm:inline-block w-16 h-8" />
            )}
          </div>
        </div>
      </header>

      {/* ─── Fast GPU-accelerated YouTube-style Drawer ─────────────────── */}
      {/* Backdrop: placed below header (top-16) so navbar stays 100% visible */}
      <div
        className={`fixed inset-0 top-16 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          menuDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer: instant 200ms GPU transform with translucent frosted glass matching navbar */}
      <aside
        className={`fixed top-16 left-0 bottom-14 sm:bottom-0 z-50 w-[240px] sm:w-[260px] sidebar-ios-glass p-3 flex flex-col justify-between shadow-2xl transition-transform duration-200 ease-out will-change-transform ${
          menuDrawerOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-label="Navigation Drawer"
      >
        <div className="space-y-3 overflow-y-auto pr-1">
          {/* Main Navigation Links List */}
          <div className="space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuDrawerOpen(false)}
                className="focus-ring flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
                activeProps={{ className: "text-white bg-neutral-800 font-bold" }}
              >
                <l.icon className="h-5 w-5 stroke-[1.8] text-neutral-400" />
                <span>{l.label}</span>
              </Link>
            ))}
          </div>

          <div className="h-px bg-neutral-800/80 my-1" />

          {/* Library & Explore Section */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1 mt-2">Explore</p>
            {user && (
              <Link
                to="/library"
                onClick={() => setMenuDrawerOpen(false)}
                className="focus-ring flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
                activeProps={{ className: "text-white bg-neutral-800 font-bold" }}
              >
                <Library className="h-5 w-5 stroke-[1.8] text-neutral-400" />
                <span>Bookmarks & Library</span>
              </Link>
            )}

            {user && (
              <Link
                to="/settings"
                onClick={() => setMenuDrawerOpen(false)}
                className="focus-ring flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
                activeProps={{ className: "text-white bg-neutral-800 font-bold" }}
              >
                <SettingsIcon className="h-5 w-5 stroke-[1.8] text-neutral-400" />
                <span>Settings</span>
              </Link>
            )}

            {showPanel && (
              <Link
                to="/admin"
                onClick={() => setMenuDrawerOpen(false)}
                className="flex items-center gap-4 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-5 w-5 stroke-[1.8]" />
                <span>{panelLabel}</span>
              </Link>
            )}

            {mounted && isAdmin && (
              <Link
                to="/security"
                onClick={() => setMenuDrawerOpen(false)}
                className="flex items-center gap-4 w-full px-3.5 py-2.5 rounded-xl text-sm font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-emerald-500/30 bg-emerald-950/20 shadow-md transition-all duration-200 cursor-pointer"
              >
                <ShieldAlert className="h-5 w-5 text-emerald-400 stroke-[2.2]" />
                <div className="flex items-center justify-between flex-1">
                  <span>Cyber Security SOC</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Action Button */}
        <div className="p-2 border-t border-neutral-800/80 mt-2">
          {!user ? (
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-9 rounded-full text-xs cursor-pointer"
              onClick={() => {
                setMenuDrawerOpen(false);
                navigate({ to: "/auth" });
              }}
            >
              Sign In
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 h-9 justify-start px-3 rounded-xl cursor-pointer"
              onClick={() => {
                setMenuDrawerOpen(false);
                signOut();
              }}
            >
              <LogOut className="mr-3 h-4 w-4" /> Sign Out
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex sm:hidden h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] items-center justify-around navbar-ios-glass border-t border-white/10 px-1 shadow-2xl">
        <Link
          to="/home"
          className="focus-ring flex flex-col items-center justify-center gap-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 flex-1"
          activeProps={{ className: "text-primary font-black" }}
        >
          <Home className="h-5 w-5 stroke-[1.8]" />
          <span>Home</span>
        </Link>

        <Link
          to="/browse"
          className="focus-ring flex flex-col items-center justify-center gap-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 flex-1"
          activeProps={{ className: "text-primary font-black" }}
        >
          <BookOpen className="h-5 w-5 stroke-[1.8]" />
          <span>Browse</span>
        </Link>

        {showPanel ? (
          <>
            {/* Center Floating Action Button for Add Series (Admin Only) */}
            <div className="relative flex items-center justify-center shrink-0 -mt-8 z-20 px-1">
              <AddNewSeriesDialog
                trigger={
                  <button
                    type="button"
                    title="Add New Series (Admin Only)"
                    aria-label="Add New Series"
                    className="group relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white text-black ring-[5px] ring-background hover:bg-neutral-200 active:scale-95 transition-all duration-150 cursor-pointer select-none shadow-md shadow-black/60"
                  >
                    <Plus className="h-6 w-6 stroke-[2.8] text-black transition-transform duration-200 group-hover:rotate-90" />
                  </button>
                }
              />
            </div>

            <Link
              to="/library"
              className="focus-ring flex flex-col items-center justify-center gap-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 flex-1"
              activeProps={{ className: "text-primary font-black" }}
            >
              <Library className="h-5 w-5 stroke-[1.8]" />
              <span>Library</span>
            </Link>

            <Link
              to={mounted && user ? "/profile" : "/auth"}
              className="focus-ring flex flex-col items-center justify-center gap-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 flex-1"
              activeProps={{ className: "text-primary font-black" }}
            >
              <UserIcon className="h-5 w-5 stroke-[1.8]" />
              <span>{mounted && user ? "Profile" : "Sign In"}</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/library"
              className="focus-ring flex flex-col items-center justify-center gap-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 flex-1"
              activeProps={{ className: "text-primary font-black" }}
            >
              <Library className="h-5 w-5 stroke-[1.8]" />
              <span>Library</span>
            </Link>

            <Link
              to="/novels"
              className="focus-ring flex flex-col items-center justify-center gap-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 flex-1"
              activeProps={{ className: "text-primary font-black" }}
            >
              <BookOpen className="h-5 w-5 stroke-[1.8]" />
              <span>Novels</span>
            </Link>

            <Link
              to={mounted && user ? "/profile" : "/auth"}
              className="focus-ring flex flex-col items-center justify-center gap-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 flex-1"
              activeProps={{ className: "text-primary font-black" }}
            >
              <UserIcon className="h-5 w-5 stroke-[1.8]" />
              <span>{mounted && user ? "Profile" : "Sign In"}</span>
            </Link>
          </>
        )}
      </nav>

      {/* Floating Awwwards Nav (Desktop, when selected) */}
      {mounted && settings.navbarStyle === "awwwards" && (
        <AwwwardsNav
          items={awwwardsItems}
          columns={awwwardsColumns}
          className="hidden sm:block"
        />
      )}

      {/* Search Dialog (lazy-loaded, rendered top-level outside header) */}
      {searchOpen && (
        <Suspense fallback={null}>
          <NavbarSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </Suspense>
      )}

      {/* Dice Roll Overlay */}
      <Suspense fallback={null}>
        <DiceRollOverlay
          open={diceOpen}
          diceResult={diceResult}
          series={diceSeries}
          onClose={handleDiceClose}
          onNavigate={handleDiceNavigate}
          onRollAgain={() => { handleDiceClose(); setTimeout(handleRandom, 50); }}
        />
      </Suspense>
    </>
  );
}



/* ─── Navbar Mini Avatar with Frame ─── */
/* Keyframes for the frame live in styles.css — no runtime style injection. */

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
  const size = 36; // px
  const borderWidth = avatarFrame === "creator" ? 3 : 2; // px
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
      case "abyss": return "conic-gradient(from 0deg, #D946EF, #4A044E, #3B0764, #D946EF)";
      case "glitch": return "conic-gradient(from 0deg, #ef4444, #06b6d4, #ef4444)";
      case "divine": return "conic-gradient(from 0deg, #FCD34D, #FFFFFF, #FFFBEB, #FCD34D)";
      case "creator": return `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor}80, transparent, ${accentColor})`;
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
      case "abyss": return "0 0 10px rgba(217,70,239,0.6), 0 0 16px rgba(139,92,246,0.3)";
      case "glitch": return "0 0 8px rgba(239,68,68,0.5), 0 0 14px rgba(6,182,212,0.3)";
      case "divine": return "0 0 10px rgba(252,211,77,0.6), 0 0 16px rgba(255,255,255,0.3)";
      case "creator": return `0 0 10px ${accentColor}, 0 0 16px ${accentColor}50`;
      default: return `0 0 6px ${accentColor}40`;
    }
  };

  const isAnimated = avatarFrame !== "none";
  const animSpeed = avatarFrame === "fire" ? "1.5s" : avatarFrame === "neon" ? "2s" : avatarFrame === "abyss" ? "4.5s" : avatarFrame === "glitch" ? "1.2s" : "3s";

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
            width={innerSize}
            height={innerSize}
            className="h-full w-full object-cover rounded-full"
            decoding="async"
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

      {/* Glitch temporal overlay */}
      {avatarFrame === "glitch" && (
        <div className="absolute inset-[-1px] pointer-events-none z-20 animate-[navGlitch_4s_infinite]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500 shadow-[0_0_2px_red]" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-cyan-400 shadow-[0_0_2px_cyan]" />
        </div>
      )}

      {/* Divine stars tiny */}
      {avatarFrame === "divine" && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-yellow-300 z-20 animate-pulse" style={{ fontSize: '7px' }}>
          ✨
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

      {/* Creator crown tiny */}
      {avatarFrame === "creator" && (
        <div className="absolute -top-1.2 left-1/2 -translate-x-1/2 text-amber-400 z-20" style={{ fontSize: '8px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))', color: accentColor }}>
          👑
        </div>
      )}
    </div>
  );
}
