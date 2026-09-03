"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Eye,
  EyeOff,
  Sparkles,
  Crown,
  Heart,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Loader2,
  BookOpen,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  totalChapters?: number;
}

export function SeriesCharactersSection({
  seriesId,
  seriesSlug,
  seriesTitle,
}: SeriesCharactersSectionProps) {
  const queryClient = useQueryClient();

  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [selectedCharacter, setSelectedCharacter] = useState<SeriesCharacter | null>(null);

  // Custom Fandom URL modal
  const [fandomModalOpen, setFandomModalOpen] = useState(false);
  const [customFandomUrl, setCustomFandomUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Load user collapse preferences
  useEffect(() => {
    try {
      const savedHidden = localStorage.getItem(`vnr_hide_chars_${seriesSlug}`);
      if (savedHidden !== null) {
        setIsHidden(savedHidden === "true");
      }
    } catch (_) {}
  }, [seriesSlug]);

  const toggleHidden = () => {
    const next = !isHidden;
    setIsHidden(next);
    try {
      localStorage.setItem(`vnr_hide_chars_${seriesSlug}`, String(next));
    } catch (_) {}
  };

  // Fetch characters for this series via API (Priority 1: Fandom.com, Priority 2: Curated Main/Useful Cast)
  const charactersQ = useQuery({
    queryKey: ["series-characters-v2", seriesSlug],
    queryFn: async (): Promise<SeriesCharacter[]> => {
      const res = await fetch(
        `/api/series/${encodeURIComponent(seriesSlug)}/characters?title=${encodeURIComponent(seriesTitle)}`
      );
      if (!res.ok) throw new Error("Failed to load characters");
      const data: any = await res.json();
      return (data.characters || []) as SeriesCharacter[];
    },
    staleTime: 1000 * 60 * 30, // 30 mins cache
  });

  const characters = charactersQ.data || [];

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
      await queryClient.invalidateQueries({ queryKey: ["series-characters-v2", seriesSlug] });
      setTimeout(() => {
        setFandomModalOpen(false);
        setImportMessage(null);
      }, 1000);
    } catch (err: any) {
      setImportMessage(err.message || "Failed to import from Fandom.");
    } finally {
      setIsImporting(false);
    }
  };

  // If loading and no characters yet, or no characters at all and not loading
  if (!charactersQ.isLoading && characters.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 pt-6 border-t border-white/5">
      {/* ─── Header: Small Title + Hide/Show Toggle + Fandom Button ─────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-purple-400 shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase font-heading">
              Characters & Cast
            </h3>
            {characters.length > 0 && (
              <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300">
                {characters.length}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Fandom Custom Link Option */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFandomModalOpen(true)}
            className="text-3xs font-mono h-7 px-2 border-white/10 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
            title="Link custom Fandom Wiki URL"
          >
            <Globe className="h-3 w-3 mr-1 text-purple-400" />
            <span>Fandom</span>
          </Button>

          {/* Hide / Show Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHidden}
            className="text-xs font-semibold h-7 px-2.5 border-white/10 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 rounded-lg cursor-pointer gap-1"
          >
            {isHidden ? (
              <>
                <Eye className="h-3 w-3 text-purple-400" />
                <span>Show</span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3 text-neutral-400" />
                <span>Hide</span>
                <ChevronUp className="h-3 w-3 text-neutral-400" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Collapsed State Mini Banner ───────────────────────────────── */}
      {isHidden && (
        <div
          onClick={toggleHidden}
          className="rounded-xl border border-white/5 bg-[#0a0a0c] hover:bg-neutral-900/60 px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all text-xs text-neutral-400"
        >
          <span className="text-3xs font-mono text-neutral-400">
            Characters section hidden ({characters.length} loaded from Fandom). Click to view.
          </span>
          <span className="text-3xs font-mono font-bold text-purple-400 flex items-center gap-1">
            <span>Expand</span>
            <ChevronDown className="h-3 w-3" />
          </span>
        </div>
      )}

      {/* ─── Expanded Small Cards Responsive Grid ──────────────────────── */}
      {!isHidden && (
        <>
          {charactersQ.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-neutral-900/80 border border-neutral-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {characters.map((char) => {
                const isMain = char.role === "MAIN";
                const isRival = char.role === "ANTAGONIST" || char.roleTitle?.toLowerCase().includes("rival");

                return (
                  <div
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    className="group relative flex items-center gap-2.5 p-2 rounded-xl bg-[#0a0a0c] border border-white/10 hover:border-purple-500/40 hover:bg-neutral-900/60 transition-all cursor-pointer shadow-sm"
                  >
                    {/* Character Photo Thumbnail */}
                    <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {char.imageUrl ? (
                        <img
                          src={char.imageUrl}
                          alt={char.name}
                          className="h-full w-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-purple-950/40 text-purple-300 font-bold text-xs">
                          {char.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Character Identity */}
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors block truncate font-heading">
                        {char.name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-3xs font-mono font-medium px-1.5 py-0.2 rounded border truncate ${
                            isMain
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : isRival
                              ? "bg-red-500/10 border-red-500/30 text-red-300"
                              : "bg-white/5 border-white/10 text-neutral-400"
                          }`}
                        >
                          {char.roleTitle || (isMain ? "Protagonist" : "Supporting")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Deep Details Modal ────────────────────────────────────────── */}
      <Dialog open={!!selectedCharacter} onOpenChange={(open) => !open && setSelectedCharacter(null)}>
        <DialogContent className="bg-[#0a0a0c] border border-white/15 text-white max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4">
          {selectedCharacter && (
            <>
              {/* Modal Header with Character Image & Titles */}
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-neutral-900 border border-white/15 shrink-0 shadow-lg">
                  {selectedCharacter.imageUrl ? (
                    <img
                      src={selectedCharacter.imageUrl}
                      alt={selectedCharacter.name}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-purple-950/40 text-purple-300 font-black text-xl">
                      {selectedCharacter.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-3xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold">
                      {selectedCharacter.roleTitle || selectedCharacter.role}
                    </span>
                    {selectedCharacter.sourceUrl && (
                      <a
                        href={selectedCharacter.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-3xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>Fandom Wiki</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight font-heading">
                    {selectedCharacter.name}
                  </h3>

                  {selectedCharacter.nativeName && (
                    <p className="text-xs text-neutral-400 font-sans">
                      {selectedCharacter.nativeName}
                    </p>
                  )}

                  {selectedCharacter.aliases && selectedCharacter.aliases.length > 0 && (
                    <p className="text-3xs font-mono text-neutral-500 truncate">
                      Aliases: {selectedCharacter.aliases.slice(0, 3).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Bio Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-black border border-white/10 font-mono text-3xs">
                <div>
                  <span className="text-neutral-500 block">Status</span>
                  <span className="text-neutral-200 font-bold">{selectedCharacter.bioData?.status || "Active"}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Gender</span>
                  <span className="text-neutral-200 font-bold">{selectedCharacter.bioData?.gender || "Unknown"}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Cultivation</span>
                  <span className="text-amber-300 font-bold truncate block">
                    {selectedCharacter.bioData?.cultivationRealm || selectedCharacter.bioData?.rank || "Peerless"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Combat Class</span>
                  <span className="text-cyan-300 font-bold truncate block">
                    {selectedCharacter.bioData?.combatClass || selectedCharacter.bioData?.affiliation || "Martial Artist"}
                  </span>
                </div>
              </div>

              {/* Biography Details */}
              {selectedCharacter.description && (
                <div className="space-y-1">
                  <h4 className="text-3xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                    Biography & Story Role
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans font-normal">
                    {selectedCharacter.description}
                  </p>
                </div>
              )}

              {/* Abilities & Weapons */}
              {((selectedCharacter.bioData?.abilities && selectedCharacter.bioData.abilities.length > 0) ||
                (selectedCharacter.bioData?.weapons && selectedCharacter.bioData.weapons.length > 0)) && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                  {selectedCharacter.bioData.abilities && selectedCharacter.bioData.abilities.length > 0 && (
                    <div>
                      <span className="text-3xs font-mono uppercase tracking-widest text-purple-400 block mb-1">
                        Known Techniques & Abilities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCharacter.bioData.abilities.map((ab, idx) => (
                          <span
                            key={idx}
                            className="text-3xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300"
                          >
                            {ab}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCharacter.bioData.weapons && selectedCharacter.bioData.weapons.length > 0 && (
                    <div>
                      <span className="text-3xs font-mono uppercase tracking-widest text-amber-400 block mb-1">
                        Weapons & Artifacts
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCharacter.bioData.weapons.map((w, idx) => (
                          <span
                            key={idx}
                            className="text-3xs font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Link to Full Profile Page */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <Link
                  href={`/title/${seriesSlug}/character/${selectedCharacter.slug}`}
                  className="text-xs font-mono font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>Open Full Bio Page</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCharacter(null)}
                  className="text-xs border-white/10 h-7 px-3"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Manual Fandom URL Import Modal ────────────────────────────── */}
      <Dialog open={fandomModalOpen} onOpenChange={setFandomModalOpen}>
        <DialogContent className="bg-[#0a0a0c] border border-white/15 text-white max-w-md space-y-3">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-400" />
              <DialogTitle className="text-base font-bold text-white font-heading">
                Sync Fandom Character Wiki
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-neutral-400">
              Input the Fandom wiki subdomain or URL for <strong>{seriesTitle}</strong> to automatically extract deep character bios, portraits, and cultivation realms.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFandomImport} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-3xs font-mono uppercase tracking-wider text-neutral-400">
                Fandom Wiki URL or Subdomain
              </label>
              <Input
                placeholder="e.g. nano-mashine or https://nano-mashine.fandom.com"
                value={customFandomUrl}
                onChange={(e) => setCustomFandomUrl(e.target.value)}
                className="h-8 text-xs bg-black border-neutral-800 text-neutral-200 placeholder:text-neutral-600 rounded-lg focus-visible:ring-purple-500/40"
              />
            </div>

            {importMessage && (
              <p
                className={`text-xs p-2 rounded-lg border ${
                  importMessage.includes("Successfully")
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                    : "bg-red-950/40 border-red-500/30 text-red-300"
                }`}
              >
                {importMessage}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFandomModalOpen(false)}
                className="text-xs border-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isImporting || !customFandomUrl.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold gap-1.5"
              >
                {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>{isImporting ? "Importing..." : "Sync From Fandom"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
