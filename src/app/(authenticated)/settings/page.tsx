"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  BookOpen,
  Palette,
  LayoutGrid,
  HardDrive,
  Lock,
  Check,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Eye,
  Sliders,
  Zap,
  Gauge,
  ScrollText,
  Copy,
  Trash2,
  RotateCcw,
  ExternalLink,
  User,
  Moon,
  Sun,
  Monitor,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Info,
  Crown,
} from "lucide-react";
import { UserAvatarFrame } from "@/components/UserAvatarFrame";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SettingsTab = "reader" | "display" | "feed" | "storage" | "admin";

interface NavItem {
  id: SettingsTab;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "reader",
    label: "Reader Experience",
    shortDesc: "Reading mode, direction & eye filters",
    icon: BookOpen,
  },
  {
    id: "display",
    label: "Display & Theme",
    shortDesc: "Theme styles & image quality",
    icon: Palette,
  },
  {
    id: "feed",
    label: "Feed & Navigation",
    shortDesc: "Content visibility & home preferences",
    icon: LayoutGrid,
  },
  {
    id: "storage",
    label: "Data & Storage",
    shortDesc: "Local cache, backup & reset",
    icon: HardDrive,
  },
  {
    id: "admin",
    label: "Admin & Release Policy",
    shortDesc: "Chapter hold & early access controls",
    icon: Lock,
    adminOnly: true,
    badge: "Admin",
  },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings, updateSettings } = useReaderSettings();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  // Active Tab state synced with URL ?tab=...
  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (tabParam && NAV_ITEMS.some((n) => n.id === tabParam)) {
      return tabParam;
    }
    return "reader";
  });

  // Keep state in sync with URL changes
  useEffect(() => {
    if (tabParam && NAV_ITEMS.some((n) => n.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const selectTab = (id: SettingsTab) => {
    setActiveTab(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  };

  // Fetch full user profile for mini card matching profile page
  const profileQ = useQuery({
    queryKey: ["profile", "me", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
  const profile = profileQ.data;

  // Fetch equipped badge/title
  const equippedBadgeQ = useQuery({
    queryKey: ["profile", "equipped-badge", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge:badge_id(*)")
        .eq("user_id", user.id)
        .eq("is_equipped", true)
        .maybeSingle();
      if (error) return null;
      return data as any;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
  const equippedBadge = equippedBadgeQ.data;

  // Calculate real level and XP progress
  const level = profile?.user_level || 1;
  const xp = profile?.experience_points || 0;
  const xpForNextLevel = Math.pow((level + 1) * 2, 2);
  const xpProgress = Math.min(100, Math.max(0, ((xp % xpForNextLevel) / xpForNextLevel) * 100));

  // Approximate local storage usage
  const [storageUsage, setStorageUsage] = useState<{ kb: number; items: number }>({
    kb: 0,
    items: 0,
  });

  const recalculateStorage = () => {
    if (typeof window === "undefined") return;
    try {
      let totalBytes = 0;
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || "";
          totalBytes += (key.length + val.length) * 2;
          count++;
        }
      }
      setStorageUsage({ kb: Math.round(totalBytes / 1024), items: count });
    } catch {
      setStorageUsage({ kb: 0, items: 0 });
    }
  };

  useEffect(() => {
    recalculateStorage();
  }, []);

  // Filter items based on permissions
  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  // Handler to reset reader settings to defaults
  const handleResetDefaults = () => {
    updateSettings({
      readingDirection: "ltr",
      pageFit: "width",
      readingMode: "page",
      imageQuality: "high",
      autoScrollSpeed: 50,
      showNovelsOnHome: false,
      readingFilter: "normal",
      enable30MinHold: true,
    });
    recalculateStorage();
    toast.success("All reader settings reset to default!");
  };

  // Handler to clear cached reader storage
  const handleClearCache = () => {
    try {
      localStorage.removeItem("vnr_recent_chapters_cache");
      localStorage.removeItem("vnr_popular_cache");
      localStorage.removeItem("vnr_cached_bookmarks");
      recalculateStorage();
      toast.success("Reader image & feed cache cleared!");
    } catch {
      toast.error("Failed to clear cache");
    }
  };

  // Handler to copy settings to clipboard
  const handleExportSettings = () => {
    try {
      const dataStr = JSON.stringify(
        {
          readerSettings: settings,
          theme,
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      );
      navigator.clipboard.writeText(dataStr);
      toast.success("Settings copied to clipboard as JSON!");
    } catch {
      toast.error("Failed to copy settings");
    }
  };

  // Auto-scroll speed descriptor
  const getSpeedLabel = (speed: number) => {
    if (speed === 0) return "Disabled (0%)";
    if (speed <= 25) return `Relaxed (${speed}%)`;
    if (speed <= 50) return `Standard (${speed}%)`;
    if (speed <= 75) return `Brisk (${speed}%)`;
    return `Speed Reader (${speed}%)`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 pt-8">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* ─── Top Header ─── */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  Preferences & Settings
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Customize your reading engine, UI theme, content feeds, and device storage
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="text-xs border-border/60 hover:border-red-500/40 hover:text-red-400 gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </Button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-3xs font-mono font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synced to Device
            </div>
          </div>
        </div>

        {/* Mobile Mini Profile Header */}
        {user && (
          <div className="md:hidden mb-6 p-4 rounded-2xl liquid-glass-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatarFrame
                avatarUrl={profile?.avatar_url}
                avatarFrame={profile?.avatar_frame || (isAdmin ? "creator" : "none")}
                accentColor={profile?.accent_color || "#8B5CF6"}
                username={profile?.username || user.email?.split("@")[0] || "User"}
                size={40}
              />
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  {profile?.username || user.email?.split("@")[0] || "Reader"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[9px] font-mono px-1 py-0.2 rounded border"
                    style={{
                      borderColor: `${profile?.accent_color || "#8B5CF6"}40`,
                      color: profile?.accent_color || "#a78bfa",
                    }}
                  >
                    {isAdmin ? "Lv. ∞" : `Lv. ${level}`}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {isAdmin ? "Staff Admin" : "Reader"}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/profile"
              className="text-2xs text-purple-300 hover:text-white font-medium px-3 py-1.5 rounded-full border border-purple-400/30 bg-purple-500/15 backdrop-blur-md shrink-0 flex items-center gap-1 shadow-sm transition-all"
            >
              <span>Profile</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* ─── Mobile Horizontal Navigation Bar ─── */}
        <div className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-2 border-b border-white/10 pb-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => selectTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border",
                  isActive
                    ? "liquid-glass bg-purple-600/20 border-purple-400/40 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                    : "liquid-glass bg-white/[0.02] border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-purple-400" : "text-muted-foreground")} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Main Two-Column Layout ─── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* ─── Left Sidebar (Desktop) ─── */}
          <aside className="hidden md:block md:col-span-4 lg:col-span-3.5 space-y-6 sticky top-20">
            
            {/* User Mini Profile Card */}
            {user && (
              <div className="rounded-2xl liquid-glass-card p-4 space-y-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="shrink-0 relative">
                    <UserAvatarFrame
                      avatarUrl={profile?.avatar_url}
                      avatarFrame={profile?.avatar_frame || (isAdmin ? "creator" : "none")}
                      accentColor={profile?.accent_color || "#8B5CF6"}
                      username={profile?.username || user.email?.split("@")[0] || "User"}
                      size={48}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate leading-snug">
                        {profile?.username || user.email?.split("@")[0] || "Reader"}
                      </p>
                      {profile?.is_vip && (
                        <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0 fill-amber-400/20" />
                      )}
                    </div>

                    {/* Role & Level Badges */}
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors"
                        style={{
                          borderColor: `${profile?.accent_color || "#8B5CF6"}40`,
                          backgroundColor: `${profile?.accent_color || "#8B5CF6"}18`,
                          color: profile?.accent_color || "#a78bfa",
                        }}
                      >
                        {isAdmin ? "Lv. ∞" : `Lv. ${level}`}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-medium truncate">
                        {isAdmin ? "Staff Admin" : "Reader"}
                      </span>
                    </div>

                    {/* Equipped Title/Badge if any */}
                    {equippedBadge?.badge && (
                      <p
                        className="text-[10px] font-semibold mt-1 truncate flex items-center gap-1"
                        style={{ color: equippedBadge.badge.badge_color || profile?.accent_color || "#8B5CF6" }}
                      >
                        <span className="text-neutral-400 font-normal">Title:</span>
                        <span>{equippedBadge.badge.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Level / Qi Progress Bar */}
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>{isAdmin ? "Dao Qi" : "Level Progress"}</span>
                    <span>{isAdmin ? "Maxed Out" : `${xpProgress.toFixed(0)}%`}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-900/80 border border-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: isAdmin ? "100%" : `${xpProgress}%`,
                        backgroundColor: profile?.accent_color || "#8B5CF6",
                      }}
                    />
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="flex items-center justify-between text-2xs text-purple-300 hover:text-purple-200 font-medium pt-1 transition-colors group"
                >
                  <span>Edit Profile & Avatar</span>
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}

            {/* Sidebar Navigation Items */}
            <nav className="liquid-glass-pill rounded-2xl p-2 space-y-1">
              <div className="px-3 py-2 text-3xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Settings Menu
              </div>

              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectTab(item.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative",
                      isActive
                        ? "liquid-glass bg-purple-600/20 text-white border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-purple-400" : "text-neutral-500 group-hover:text-neutral-300"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-purple-400 ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Device Sync Info Box */}
            <div className="rounded-xl border border-border/40 bg-neutral-950/40 p-3.5 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 text-foreground font-medium text-2xs uppercase tracking-wider font-mono">
                <Info className="h-3.5 w-3.5 text-purple-400" />
                Persistent Storage
              </div>
              <p className="text-3xs leading-relaxed">
                Reading preferences are saved on this browser and take effect immediately across all manga, manhwa & novel chapters.
              </p>
            </div>
          </aside>

          {/* ─── Right Content Area ─── */}
          <main className="col-span-1 md:col-span-8 lg:col-span-8.5 space-y-6">
            
            {/* ══════════════════════════════════════════════════════════
                TAB 1: READER EXPERIENCE
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "reader" && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <Card className="liquid-glass-card shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-400" />
                      Reading Experience Engine
                    </CardTitle>
                    <CardDescription>
                      Configure page orientation, continuous webtoon flow, and eye comfort filters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Reading Mode */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-white">Reading Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          Choose how manga and manhwa chapters are presented
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => updateSettings({ readingMode: "webtoon" })}
                          className={cn(
                            "flex flex-col text-left p-3.5 rounded-xl border transition-all text-xs relative",
                            settings.readingMode === "webtoon"
                              ? "bg-purple-950/20 border-purple-500/50 text-white shadow-sm ring-1 ring-purple-500/30"
                              : "bg-neutral-900/50 border-border/40 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/40"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold flex items-center gap-1.5">
                              <ScrollText className="h-4 w-4 text-purple-400" />
                              Continuous Scroll (Webtoon)
                            </span>
                            {settings.readingMode === "webtoon" && (
                              <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-2xs text-muted-foreground leading-normal">
                            Smooth vertical endless scroll with automatic chapter transitions. Recommended for manhwa.
                          </p>
                          <Badge variant="outline" className="mt-2.5 w-fit text-[10px] border-purple-500/30 text-purple-300 bg-purple-950/30">
                            Recommended
                          </Badge>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateSettings({ readingMode: "page" })}
                          className={cn(
                            "flex flex-col text-left p-3.5 rounded-xl border transition-all text-xs relative",
                            settings.readingMode === "page"
                              ? "bg-purple-950/20 border-purple-500/50 text-white shadow-sm ring-1 ring-purple-500/30"
                              : "bg-neutral-900/50 border-border/40 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/40"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-purple-400" />
                              Page by Page
                            </span>
                            {settings.readingMode === "page" && (
                              <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-2xs text-muted-foreground leading-normal">
                            Shows one page at a time with keyboard arrow and click navigation. Traditional style.
                          </p>
                        </button>
                      </div>
                    </div>

                    <Separator className="border-border/30" />

                    {/* Reading Direction */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-white">Reading Direction</Label>
                        <p className="text-xs text-muted-foreground">
                          Order and progression sequence when advancing pages
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          {
                            id: "vertical",
                            title: "Vertical",
                            desc: "Top to bottom scroll",
                            badge: "Webtoon",
                          },
                          {
                            id: "ltr",
                            title: "Left to Right",
                            desc: "Western comic layout",
                            badge: "LTR",
                          },
                          {
                            id: "rtl",
                            title: "Right to Left",
                            desc: "Traditional manga layout",
                            badge: "RTL",
                          },
                        ].map((dir) => {
                          const isSelected = settings.readingDirection === dir.id;
                          return (
                            <button
                              key={dir.id}
                              type="button"
                              onClick={() => updateSettings({ readingDirection: dir.id as any })}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all text-xs flex flex-col justify-between",
                                isSelected
                                  ? "bg-purple-950/20 border-purple-500/50 text-white ring-1 ring-purple-500/30"
                                  : "bg-neutral-900/40 border-border/40 text-neutral-300 hover:bg-neutral-800/40 hover:border-neutral-700"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-white">{dir.title}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                              </div>
                              <span className="text-3xs text-muted-foreground">{dir.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Separator className="border-border/30" />

                    {/* Eye Comfort Filter */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-semibold text-white flex items-center gap-1.5">
                            <Eye className="h-4 w-4 text-purple-400" />
                            Eye Comfort Filter
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Color temperature tint applied across chapter viewer to reduce fatigue
                          </p>
                        </div>
                        <Badge variant="outline" className="text-3xs uppercase font-mono">
                          {settings.readingFilter || "normal"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          {
                            id: "normal",
                            title: "Normal",
                            desc: "Natural contrast",
                            swatch: "bg-neutral-900 border-neutral-700",
                          },
                          {
                            id: "oled",
                            title: "OLED Black",
                            desc: "Pure #000 deep black",
                            swatch: "bg-black border-neutral-800",
                          },
                          {
                            id: "warm",
                            title: "Warm Amber",
                            desc: "Blue light reduction",
                            swatch: "bg-[#2b1f14] border-amber-900/50",
                          },
                          {
                            id: "dim",
                            title: "Dim Night",
                            desc: "Low-glare brightness",
                            swatch: "bg-neutral-950 border-neutral-900",
                          },
                        ].map((filter) => {
                          const isSelected = (settings.readingFilter || "normal") === filter.id;
                          return (
                            <button
                              key={filter.id}
                              type="button"
                              onClick={() => {
                                updateSettings({ readingFilter: filter.id as any });
                                toast.info(`Eye filter set to: ${filter.title}`);
                              }}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all text-xs flex flex-col gap-2 relative",
                                isSelected
                                  ? "bg-purple-950/20 border-purple-500/50 text-white ring-1 ring-purple-500/30"
                                  : "bg-neutral-900/40 border-border/40 text-neutral-300 hover:bg-neutral-800/40 hover:border-neutral-700"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className={cn("h-4 w-4 rounded-full border shadow-inner", filter.swatch)} />
                                {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                              </div>
                              <div>
                                <p className="font-semibold text-white leading-tight">{filter.title}</p>
                                <p className="text-3xs text-muted-foreground mt-0.5">{filter.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Separator className="border-border/30" />

                    {/* Page Fit */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-white">Page Fit & Scaling</Label>
                        <p className="text-xs text-muted-foreground">
                          Determine how images conform to your monitor or mobile viewport
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          {
                            id: "width",
                            title: "Fit to Width",
                            desc: "Fills width of container",
                          },
                          {
                            id: "height",
                            title: "Fit to Height",
                            desc: "Fits entire page height",
                          },
                          {
                            id: "original",
                            title: "Original Size",
                            desc: "1:1 pixel rendering",
                          },
                        ].map((fit) => {
                          const isSelected = settings.pageFit === fit.id;
                          return (
                            <button
                              key={fit.id}
                              type="button"
                              onClick={() => updateSettings({ pageFit: fit.id as any })}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all text-xs flex flex-col justify-between",
                                isSelected
                                  ? "bg-purple-950/20 border-purple-500/50 text-white ring-1 ring-purple-500/30"
                                  : "bg-neutral-900/40 border-border/40 text-neutral-300 hover:bg-neutral-800/40 hover:border-neutral-700"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-white">{fit.title}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                              </div>
                              <span className="text-3xs text-muted-foreground">{fit.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Separator className="border-border/30" />

                    {/* Auto-scroll Speed */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="scroll-speed" className="text-sm font-semibold text-white flex items-center gap-1.5">
                            <Gauge className="h-4 w-4 text-purple-400" />
                            Auto-Scroll Velocity
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Automatic hands-free scrolling speed in continuous webtoon mode
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs font-mono font-bold text-purple-300 border-purple-500/30 bg-purple-950/30">
                          {getSpeedLabel(settings.autoScrollSpeed)}
                        </Badge>
                      </div>

                      <div className="space-y-2 pt-1">
                        <Slider
                          id="scroll-speed"
                          min={0}
                          max={100}
                          step={5}
                          value={[settings.autoScrollSpeed]}
                          onValueChange={(value) => updateSettings({ autoScrollSpeed: value[0] })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-3xs text-neutral-500 font-mono">
                          <span>Off (0%)</span>
                          <span>Relaxed (25%)</span>
                          <span>Standard (50%)</span>
                          <span>Fast (75%)</span>
                          <span>Turbo (100%)</span>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 2: DISPLAY & THEME
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "display" && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <Card className="liquid-glass-card shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-400" />
                      Display & Theme Settings
                    </CardTitle>
                    <CardDescription>
                      Theme styling, image resolution tiers, and bandwidth controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Website Theme */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-white">Website Theme</Label>
                        <p className="text-xs text-muted-foreground">
                          Choose dark obsidian, clean light, or sync with your operating system
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            id: "dark",
                            title: "Dark Obsidian",
                            desc: "Deep blacks and slate accents",
                            icon: Moon,
                          },
                          {
                            id: "light",
                            title: "Clean Light",
                            desc: "High-contrast daylight mode",
                            icon: Sun,
                          },
                          {
                            id: "system",
                            title: "System Sync",
                            desc: "Match device OS theme",
                            icon: Monitor,
                          },
                        ].map((thm) => {
                          const Icon = thm.icon;
                          const isSelected = theme === thm.id;
                          return (
                            <button
                              key={thm.id}
                              type="button"
                              onClick={() => {
                                setTheme(thm.id as any);
                                toast.info(`Theme set to: ${thm.title}`);
                              }}
                              className={cn(
                                "p-3.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between",
                                isSelected
                                  ? "bg-purple-950/20 border-purple-500/50 text-white ring-1 ring-purple-500/30"
                                  : "bg-neutral-900/40 border-border/40 text-neutral-300 hover:bg-neutral-800/40 hover:border-neutral-700"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Icon className={cn("h-4 w-4", isSelected ? "text-purple-400" : "text-neutral-400")} />
                                {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{thm.title}</p>
                                <p className="text-3xs text-muted-foreground mt-0.5">{thm.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Separator className="border-border/30" />

                    {/* Image Resolution & Quality */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-white">Image Resolution Tier</Label>
                        <p className="text-xs text-muted-foreground">
                          Balances visual clarity against cellular data and bandwidth consumption
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            id: "high",
                            title: "High Quality",
                            desc: "Lossless crisp images. Best for high-speed Wi-Fi.",
                            badge: "Standard",
                          },
                          {
                            id: "medium",
                            title: "Medium Quality",
                            desc: "Optimized compression with quick page preloading.",
                            badge: "Balanced",
                          },
                          {
                            id: "low",
                            title: "Low (Data Saver)",
                            desc: "Highest compression for metered cellular data.",
                            badge: "Data Saver",
                          },
                        ].map((q) => {
                          const isSelected = settings.imageQuality === q.id;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => {
                                updateSettings({ imageQuality: q.id as any });
                                toast.info(`Image quality: ${q.title}`);
                              }}
                              className={cn(
                                "p-3.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between",
                                isSelected
                                  ? "bg-purple-950/20 border-purple-500/50 text-white ring-1 ring-purple-500/30"
                                  : "bg-neutral-900/40 border-border/40 text-neutral-300 hover:bg-neutral-800/40 hover:border-neutral-700"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-white">{q.title}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                              </div>
                              <p className="text-2xs text-muted-foreground leading-normal mb-2">
                                {q.desc}
                              </p>
                              <Badge variant="outline" className="text-[10px] w-fit">
                                {q.badge}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 3: FEED & NAVIGATION
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "feed" && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <Card className="liquid-glass-card shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-purple-400" />
                      Home Feed & Content Navigation
                    </CardTitle>
                    <CardDescription>
                      Control what content formats are spotlighted on home page feeds and discover lists
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Show Novels on Home Page Toggle */}
                    <div className="p-4 rounded-xl border border-border/40 bg-neutral-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="show-novels" className="font-semibold text-white cursor-pointer text-sm">
                            Show Web Novels on Home Page
                          </Label>
                          {settings.showNovelsOnHome ? (
                            <Badge className="bg-purple-950/40 text-purple-300 border-purple-500/30 text-[10px]">
                              Showing Novels
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-neutral-400">
                              Comics Only
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                          When enabled, web novels appear in home carousels, recently added chapter updates, and popular rankings. When turned off, the home feed focuses exclusively on manhwa & manga.
                        </p>
                      </div>

                      <Switch
                        id="show-novels"
                        checked={settings.showNovelsOnHome}
                        onCheckedChange={(checked) => {
                          updateSettings({ showNovelsOnHome: checked });
                          toast.success(checked ? "Web novels enabled on home feed" : "Home feed set to comics only");
                        }}
                      />
                    </div>

                    <Separator className="border-border/30" />

                    {/* Quick Catalog Shortcuts */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-white">Explore Catalog Hubs</Label>
                      <p className="text-xs text-muted-foreground">
                        Direct shortcuts to discover curated collections across the platform
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <Link
                          href="/browse"
                          className="p-3.5 rounded-xl border border-border/40 bg-neutral-900/40 hover:bg-neutral-800/50 hover:border-neutral-700 transition-all text-xs flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                              Browse All Series →
                            </p>
                            <p className="text-3xs text-muted-foreground">Filter by genres, release status & demography</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        <Link
                          href="/novels"
                          className="p-3.5 rounded-xl border border-border/40 bg-neutral-900/40 hover:bg-neutral-800/50 hover:border-neutral-700 transition-all text-xs flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                              Web Novels Directory →
                            </p>
                            <p className="text-3xs text-muted-foreground">Creator-first translated and original novels</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 4: DATA & STORAGE
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "storage" && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <Card className="liquid-glass-card shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-purple-400" />
                      Device Storage & Diagnostics
                    </CardTitle>
                    <CardDescription>
                      Manage locally stored reader preferences, clear image cache, and export settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Storage Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-border/40 bg-neutral-950/40 space-y-1">
                        <span className="text-3xs font-mono uppercase tracking-wider text-muted-foreground">
                          Estimated LocalStorage Space
                        </span>
                        <p className="text-2xl font-bold font-mono text-white">
                          ~{storageUsage.kb} KB
                        </p>
                        <p className="text-2xs text-muted-foreground">
                          Stored across {storageUsage.items} browser keys
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-border/40 bg-neutral-950/40 space-y-1">
                        <span className="text-3xs font-mono uppercase tracking-wider text-muted-foreground">
                          Cloud Account Link
                        </span>
                        <p className="text-2xl font-bold text-white">
                          {user ? "Connected" : "Guest Mode"}
                        </p>
                        <p className="text-2xs text-muted-foreground truncate">
                          {user?.email || "Preferences stored on this device only"}
                        </p>
                      </div>
                    </div>

                    <Separator className="border-border/30" />

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-white">Cache & Maintenance Actions</Label>

                      <div className="space-y-2.5">
                        <div className="p-3.5 rounded-xl border border-border/40 bg-neutral-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-white">Clear Reader Feed & Image Cache</p>
                            <p className="text-2xs text-muted-foreground">
                              Purges temporary cached chapters and feed queries without logging you out.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearCache}
                            className="text-xs border-border/60 hover:bg-neutral-800 shrink-0 gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-neutral-400" />
                            Clear Cache
                          </Button>
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/40 bg-neutral-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-white">Export Settings JSON</p>
                            <p className="text-2xs text-muted-foreground">
                              Copies your complete reader settings and theme configuration to your clipboard.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportSettings}
                            className="text-xs border-border/60 hover:bg-neutral-800 shrink-0 gap-1.5"
                          >
                            <Copy className="h-3.5 w-3.5 text-neutral-400" />
                            Copy to Clipboard
                          </Button>
                        </div>

                        <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-red-300">Reset All Reader Defaults</p>
                            <p className="text-2xs text-neutral-400">
                              Restores reading mode, direction, fit, and eye comfort filters to factory defaults.
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleResetDefaults}
                            className="text-xs shrink-0 gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset Everything
                          </Button>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 5: ADMIN & RELEASE POLICY (Admin Only)
            ══════════════════════════════════════════════════════════ */}
            {activeTab === "admin" && isAdmin && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <Card className="liquid-glass-card border-amber-500/30 bg-gradient-to-b from-neutral-950/70 via-neutral-900/50 to-amber-950/20 shadow-2xl">
                  <CardHeader className="pb-4 border-b border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-400">
                        <Lock className="h-5 w-5 text-amber-500" />
                        Chapter Release & Early Access Hold Policy
                      </CardTitle>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono text-xs">
                        Admin Privileges
                      </Badge>
                    </div>
                    <CardDescription className="text-neutral-400">
                      Configure early access countdown locks and auto-release policies for newly uploaded chapters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">

                    {/* 30-Minute Early Access Hold Toggle */}
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="admin-hold-switch" className="font-semibold text-white cursor-pointer text-sm">
                            30-Minute Early Access Chapter Hold
                          </Label>
                          {settings.enable30MinHold !== false ? (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                              Active Hold
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-neutral-400">
                              Disabled (Instant Release)
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
                          When enabled, newly imported chapters have a 30-minute early access hold with countdown timers before unlocking. When turned off, chapters are immediately unlocked for all readers with zero wait time.
                        </p>
                      </div>

                      <Switch
                        id="admin-hold-switch"
                        checked={settings.enable30MinHold !== false}
                        onCheckedChange={(checked) => {
                          updateSettings({ enable30MinHold: checked });
                          toast.success(
                            checked
                              ? "30-Minute Chapter Early Access Hold Activated"
                              : "Early Access Hold Disabled (Instant Unlocks)"
                          );
                        }}
                      />
                    </div>

                    {/* Admin Dashboard Direct Links */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-semibold text-white">Staff Management Consoles</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link
                          href="/admin/series"
                          className="p-3.5 rounded-xl border border-amber-500/20 bg-neutral-900/50 hover:bg-amber-950/30 hover:border-amber-500/40 transition-all text-xs flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                              Series & Chapter Manager →
                            </p>
                            <p className="text-3xs text-muted-foreground">Manage scraper schedules, releases & titles</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        <Link
                          href="/admin"
                          className="p-3.5 rounded-xl border border-amber-500/20 bg-neutral-900/50 hover:bg-amber-950/30 hover:border-amber-500/40 transition-all text-xs flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                              Full Admin Dashboard →
                            </p>
                            <p className="text-3xs text-muted-foreground">User roles, bans, audits and system logs</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="animate-pulse flex flex-col items-center gap-3 text-muted-foreground text-sm">
            <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span>Loading preferences...</span>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
