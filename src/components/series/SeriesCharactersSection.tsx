"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Crown,
  Heart,
  Flame,
  Swords,
  Scroll,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Columns,
  ExternalLink,
  Globe,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { SeriesCharacter } from "@/lib/character-fetcher";

interface SeriesCharactersSectionProps {
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  totalChapters: number;
}

export function SeriesCharactersSection({
  seriesId,
  seriesSlug,
  seriesTitle,
  totalChapters,
}: SeriesCharactersSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid");
  const [manualReveal, setManualReveal] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");

  // Custom Fandom Import Modal State
  const [fandomModalOpen, setFandomModalOpen] = useState(false);
  const [customFandomUrl, setCustomFandomUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Load user collapse / view mode preferences
  useEffect(() => {
    try {
      const savedHidden = localStorage.getItem(`vnr_hide_characters_${seriesSlug}`);
      if (savedHidden !== null) {
        setIsHidden(savedHidden === "true");
      }
      const savedMode = localStorage.getItem("vnr_characters_view_mode");
      if (savedMode === "grid" || savedMode === "carousel") {
        setViewMode(savedMode);
      }
    } catch {
      // ignore
    }
  }, [seriesSlug]);

  const toggleHidden = () => {
    const next = !isHidden;
    setIsHidden(next);
    try {
      localStorage.setItem(`vnr_hide_characters_${seriesSlug}`, String(next));
    } catch {
      // ignore
    }
  };

  const toggleViewMode = (mode: "grid" | "carousel") => {
    setViewMode(mode);
    try {
      localStorage.setItem("vnr_characters_view_mode", mode);
    } catch {
      // ignore
    }
  };

  // Fetch characters for this series via our API route
  const charactersQ = useQuery({
    queryKey: ["series-characters", seriesSlug],
    queryFn: async () => {
      const res = await fetch(
        `/api/series/${encodeURIComponent(seriesSlug)}/characters?title=${encodeURIComponent(seriesTitle)}`
      );
      if (!res.ok) throw new Error("Failed to load characters");
      const data: any = await res.json();
      return (data.characters || []) as SeriesCharacter[];
    },
    staleTime: 1000 * 60 * 30, // 30 mins cache
  });

  // Fetch user's read chapters count for this series
  const userReadCountQ = useQuery({
    queryKey: ["series-read-count", seriesId, user?.id],
    queryFn: async () => {
      if (!user || !seriesId) {
        if (typeof window === "undefined") return 0;
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("chapter-progress-")) {
            const prog = parseInt(localStorage.getItem(key) || "0", 10);
            if (prog >= 50) count++;
          }
        }
        return count;
      }

      const { count, error } = await supabase
        .from("reading_history")
        .select("chapter_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .gte("progress", 50);

      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 2,
  });

  const readCount = userReadCountQ.data ?? 0;
  const requiredChapters = Math.max(1, Math.ceil((totalChapters || 1) * 0.1));
  const isUnlockedByProgress = readCount >= requiredChapters;
  const isUnlocked = isUnlockedByProgress || manualReveal;

  const characters = charactersQ.data || [];

  // Filtered characters list
  const filteredCharacters = useMemo(() => {
    if (selectedRoleFilter === "ALL") return characters;
    if (selectedRoleFilter === "MAIN") {
      return characters.filter((c) => c.role === "MAIN");
    }
    if (selectedRoleFilter === "SUPPORTING") {
      return characters.filter((c) => c.role === "SUPPORTING");
    }
    if (selectedRoleFilter === "RIVALS") {
      return characters.filter((c) => c.role === "ANTAGONIST");
    }
    return characters;
  }, [characters, selectedRoleFilter]);

  // Handle custom Fandom wiki import
  const handleFandomImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFandomUrl.trim()) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const res = await fetch(`/api/series/${encodeURIComponent(seriesSlug)}/characters/fandom-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fandomUrl: customFandomUrl.trim() }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import from Fandom");
      }

      setImportMessage(`Successfully imported ${data.count} characters from Fandom!`);
      await queryClient.invalidateQueries({ queryKey: ["series-characters", seriesSlug] });
      setTimeout(() => {
        setFandomModalOpen(false);
        setImportMessage(null);
      }, 1200);
    } catch (err: any) {
      setImportMessage(err.message || "Failed to import from Fandom.");
    } finally {
      setIsImporting(false);
    }
  };

  if (!charactersQ.isLoading && characters.length === 0) {
    return null;
  }

  // Clean role badge helper that never truncates awkwardly
  const getRoleBadge = (char: SeriesCharacter) => {
    const isProtagonist =
      char.role === "MAIN" &&
      (char.roleTitle?.toLowerCase().includes("protagonist") ||
        char.name.toLowerCase().includes("gu changge") ||
        char.name.toLowerCase().includes("cheon yeo") ||
        char.name.toLowerCase().includes("vikir") ||
        char.name.toLowerCase().includes("jin-woo") ||
        char.name.toLowerCase().includes("bjorn"));

    if (isProtagonist) {
      return {
        label: "Protagonist",
        badgeClass:
          "bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-sm shadow-amber-500/10",
        icon: <Crown className="h-3 w-3 text-amber-400 shrink-0" />,
        borderGlow: "hover:border-amber-500/50 hover:shadow-amber-500/10",
      };
    }

    if (
      char.roleTitle?.toLowerCase().includes("heroine") ||
      char.roleTitle?.toLowerCase().includes("empress") ||
      char.roleTitle?.toLowerCase().includes("female lead") ||
      char.name.toLowerCase().includes("mun ku")
    ) {
      return {
        label: "Main Heroine",
        badgeClass:
          "bg-rose-500/20 border-rose-400/40 text-rose-300",
        icon: <Heart className="h-3 w-3 text-rose-400 shrink-0" />,
        borderGlow: "hover:border-rose-500/50 hover:shadow-rose-500/10",
      };
    }

    if (char.role === "ANTAGONIST" || char.roleTitle?.toLowerCase().includes("rival")) {
      return {
        label: "Destined Rival",
        badgeClass:
          "bg-red-500/20 border-red-400/40 text-red-300",
        icon: <Flame className="h-3 w-3 text-red-400 shrink-0" />,
        borderGlow: "hover:border-red-500/50 hover:shadow-red-500/10",
      };
    }

    return {
      label: "Supporting",
      badgeClass:
        "bg-purple-950/60 border-purple-500/40 text-purple-300",
      icon: <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />,
      borderGlow: "hover:border-purple-500/50 hover:shadow-purple-500/10",
    };
  };

  return (
    <section className="space-y-4 pt-6 border-t border-white/5">
      {/* ─── Header: Main Characters & Key Roles with Hide/Show ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-md shadow-purple-950/40">
            <Users className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5 font-heading">
              <span>Main Characters & Key Roles</span>
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                {characters.length}
              </span>
            </h3>
            <p className="text-xs text-neutral-400 font-sans">
              Story figures, cultivation realms, and relational bonds
            </p>
          </div>
        </div>

        {/* Action Controls: Hide/Show + Fandom Wiki Import + Layout Mode */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Fandom Custom URL Import Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFandomModalOpen(true)}
            className="text-xs font-sans h-8 px-2.5 border-neutral-800 hover:border-purple-500/40 bg-neutral-900/70 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg cursor-pointer"
            title="Import character data from custom Fandom Wiki URL"
          >
            <Globe className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
            <span>Fandom Wiki</span>
          </Button>

          {/* Grid / Shelf View Mode Toggle */}
          {!isHidden && (
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-neutral-800">
              <button
                onClick={() => toggleViewMode("grid")}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-purple-600 text-white shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Responsive Multi-Column Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => toggleViewMode("carousel")}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === "carousel"
                    ? "bg-purple-600 text-white shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Horizontal Scroll Shelf View"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Hide / Show Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHidden}
            className="text-xs font-semibold h-8 px-3 border-neutral-800 hover:border-purple-500/50 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 rounded-lg cursor-pointer gap-1.5"
          >
            {isHidden ? (
              <>
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                <span>Show Characters ({characters.length})</span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-neutral-400" />
                <span>Hide Characters</span>
                <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Collapsed State Notification Bar ─────────────────────────── */}
      {isHidden && (
        <div
          onClick={toggleHidden}
          className="rounded-xl border border-white/10 bg-neutral-950/80 hover:bg-neutral-900/60 p-3.5 flex items-center justify-between cursor-pointer transition-all text-xs text-neutral-400 group"
        >
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-purple-400" />
            <span>
              Characters section is hidden. Click to reveal all <strong>{characters.length} characters</strong> and story roles.
            </span>
          </div>
          <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
            <span>Expand</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        </div>
      )}

      {/* ─── Expanded Characters Body ─────────────────────────────────── */}
      {!isHidden && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Pills & Spoiler Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <button
                onClick={() => setSelectedRoleFilter("ALL")}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 font-sans ${
                  selectedRoleFilter === "ALL"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                    : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                All Cast ({characters.length})
              </button>
              <button
                onClick={() => setSelectedRoleFilter("MAIN")}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 font-sans ${
                  selectedRoleFilter === "MAIN"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                    : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                👑 Protagonists & Heroines
              </button>
              <button
                onClick={() => setSelectedRoleFilter("SUPPORTING")}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 font-sans ${
                  selectedRoleFilter === "SUPPORTING"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                    : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                ✨ Core Supporting
              </button>
              {characters.some((c) => c.role === "ANTAGONIST") && (
                <button
                  onClick={() => setSelectedRoleFilter("RIVALS")}
                  className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 font-sans ${
                    selectedRoleFilter === "RIVALS"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                      : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
                  }`}
                >
                  ⚡ Destined Rivals
                </button>
              )}
            </div>

            {/* Spoiler Guard Toggle Badge */}
            <div className="flex items-center gap-2 shrink-0">
              {isUnlockedByProgress ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/15 border-emerald-500/40 text-emerald-300 text-2xs uppercase font-mono font-bold px-2.5 py-1 gap-1.5"
                >
                  <Unlock className="h-3 w-3" />
                  <span>10%+ Read • Spoilers Unlocked</span>
                </Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-amber-500/15 border-amber-500/40 text-amber-300 text-2xs uppercase font-mono font-bold px-2.5 py-1 gap-1.5"
                  >
                    <Lock className="h-3 w-3" />
                    <span>{readCount}/{requiredChapters} Ch. to Unlock</span>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManualReveal(!manualReveal)}
                    className="text-2xs text-neutral-400 hover:text-white h-7 px-2 border border-neutral-800 rounded-lg cursor-pointer"
                  >
                    {manualReveal ? "Hide Spoilers" : "Reveal Spoilers"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Spoiler Guard Banner if locked */}
          {!isUnlocked && (
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-neutral-950 to-neutral-950 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5 text-amber-200/90 font-sans">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Spoiler Guard Active:</strong> Character bonds are concealed until you have read at least <strong>10% ({requiredChapters} chapters)</strong>.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setManualReveal(true)}
                className="text-xs text-amber-300 border-amber-500/50 bg-amber-950/50 hover:bg-amber-900/60 h-7 px-3 shrink-0 rounded-lg cursor-pointer font-sans"
              >
                Reveal Bonds
              </Button>
            </div>
          )}

          {/* ─── Characters Display: Responsive Grid or Scroll Carousel ──── */}
          {charactersQ.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
                  : "flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide"
              }
            >
              {filteredCharacters.map((char) => {
                const badgeMeta = getRoleBadge(char);
                const realmDisplay =
                  char.bioData?.cultivationRealm || char.bioData?.rank || char.bioData?.combatClass;

                return (
                  <Link
                    key={char.id}
                    href={`/title/${seriesSlug}/character/${char.slug}`}
                    className={`group flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-950 shadow-xl transition-all duration-300 cursor-pointer ${
                      viewMode === "carousel" ? "flex-shrink-0 w-44 sm:w-52" : "w-full"
                    } ${badgeMeta.borderGlow}`}
                  >
                    {/* Character Portrait with Ambient Vignette */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
                      {char.imageUrl ? (
                        <img
                          src={char.imageUrl}
                          alt={char.name}
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-t from-neutral-950 via-purple-950/30 to-neutral-900 text-neutral-400 font-black text-2xl font-heading">
                          {char.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      {/* Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent pointer-events-none" />

                      {/* Clean Role Badge (Never cut off or truncated) */}
                      <div className="absolute top-2 left-2 pointer-events-none">
                        <span
                          className={`inline-flex items-center gap-1 text-3xs font-mono font-bold uppercase tracking-wider py-0.5 px-2 rounded-full border backdrop-blur-md shadow ${badgeMeta.badgeClass}`}
                        >
                          {badgeMeta.icon}
                          <span>{badgeMeta.label}</span>
                        </span>
                      </div>

                      {/* Cultivation / Combat Rank Pill on Portrait */}
                      {realmDisplay && (
                        <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                          <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-lg bg-black/85 border border-purple-500/30 text-purple-300 backdrop-blur-md truncate max-w-full font-sans">
                            <Zap className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                            <span className="truncate">{realmDisplay}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Character Details */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-1 font-heading">
                          {char.name}
                        </h4>
                        {char.nativeName && (
                          <p className="text-3xs text-neutral-400 font-medium line-clamp-1 mt-0.5 font-sans">
                            {char.nativeName}
                          </p>
                        )}
                        {char.description && (
                          <p className="text-3xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed font-sans">
                            {char.description}
                          </p>
                        )}
                      </div>

                      {/* Relationships Section */}
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-3xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                          <span>Bonds:</span>
                          {char.relationships && char.relationships.length > 0 && (
                            <span className="text-neutral-500">({char.relationships.length})</span>
                          )}
                        </div>

                        {isUnlocked ? (
                          char.relationships && char.relationships.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {char.relationships.slice(0, 2).map((rel, idx) => (
                                <div
                                  key={idx}
                                  className="text-3xs px-1.5 py-0.5 rounded bg-neutral-900/80 text-neutral-300 border border-neutral-800 flex items-center justify-between gap-1 truncate font-sans"
                                  title={`${rel.relationType}: ${rel.name}`}
                                >
                                  <span className="font-bold text-purple-400 truncate max-w-[80px]">
                                    {rel.relationType}
                                  </span>
                                  <span className="text-neutral-300 truncate max-w-[90px]">
                                    {rel.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-3xs text-neutral-500 italic block py-0.5 font-sans">
                              Central role
                            </span>
                          )
                        ) : (
                          <div className="rounded bg-amber-950/20 p-1 border border-amber-500/20 flex items-center justify-center gap-1 text-3xs text-amber-300 font-bold font-mono">
                            <Lock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                            <span>Locked ({char.relationships?.length || 2})</span>
                          </div>
                        )}
                      </div>

                      {/* View Bio Link */}
                      <div className="pt-1 flex items-center justify-between text-3xs font-bold text-purple-400 group-hover:text-purple-300 transition-colors font-sans">
                        <span className="uppercase tracking-wider">Bio & Lore</span>
                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Manual Fandom URL Import Dialog Modal ────────────────────── */}
      <Dialog open={fandomModalOpen} onOpenChange={setFandomModalOpen}>
        <DialogContent className="max-w-md bg-neutral-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2 font-heading">
              <Globe className="h-4.5 w-4.5 text-purple-400" />
              <span>Import from Fandom Wiki</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400 font-sans">
              Enter the exact Fandom wiki URL for <strong>{seriesTitle}</strong> (e.g. <code>https://nano-mashine.fandom.com</code>).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFandomImport} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-3xs font-mono uppercase tracking-wider text-neutral-400 block">
                Fandom Wiki URL or Subdomain:
              </label>
              <Input
                type="text"
                placeholder="https://your-series.fandom.com"
                value={customFandomUrl}
                onChange={(e) => setCustomFandomUrl(e.target.value)}
                className="bg-neutral-900 border-white/10 text-white font-mono text-xs h-9 rounded-lg"
                required
              />
              <p className="text-3xs text-neutral-500 font-sans">
                Our scraper will crawl all character categories, download direct high-res portraits, and sync bio data automatically.
              </p>
            </div>

            {importMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-sans ${
                  importMessage.includes("Successfully")
                    ? "bg-emerald-950/30 border border-emerald-500/40 text-emerald-300"
                    : "bg-red-950/30 border border-red-500/40 text-red-300"
                }`}
              >
                {importMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFandomModalOpen(false)}
                className="text-xs font-sans text-neutral-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isImporting || !customFandomUrl.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 px-4 rounded-lg cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Crawling Wiki...
                  </>
                ) : (
                  "Sync Characters"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
