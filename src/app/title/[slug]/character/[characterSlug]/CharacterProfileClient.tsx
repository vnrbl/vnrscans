"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Shield,
  Sparkles,
  Zap,
  Users,
  Award,
  BookOpen,
  ArrowLeft,
  ExternalLink,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Flame,
  Swords,
  HeartHandshake,
  Crown,
  Heart,
  Scroll,
  Quote,
  Compass,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormattedText } from "@/components/FormattedText";
import type { SeriesCharacter } from "@/lib/character-fetcher";

interface CharacterProfileClientProps {
  series: {
    id: string;
    title: string;
    slug: string;
    cover_url?: string | null;
    type?: string | null;
  };
  character: SeriesCharacter;
  otherCharacters: SeriesCharacter[];
}

export default function CharacterProfileClient({
  series,
  character,
  otherCharacters,
}: CharacterProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"LORE" | "CULTIVATION" | "BONDS" | "TRIVIA">("LORE");
  const [showSpoilers, setShowSpoilers] = useState(false);

  // Role visual aesthetics
  const isProtagonist =
    character.role === "MAIN" &&
    (character.roleTitle?.toLowerCase().includes("protagonist") ||
      character.name.toLowerCase().includes("gu changge") ||
      character.name.toLowerCase().includes("vikir") ||
      character.name.toLowerCase().includes("jin-woo") ||
      character.name.toLowerCase().includes("bjorn"));

  const roleTheme = isProtagonist
    ? {
        label: character.roleTitle || "Protagonist",
        badge: "bg-gradient-to-r from-amber-500/25 via-purple-600/30 to-amber-500/25 border-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/20",
        borderGlow: "border-amber-500/40 shadow-amber-500/15",
        icon: <Crown className="h-4 w-4 text-amber-400" />,
        accentText: "text-amber-400",
      }
    : character.roleTitle?.toLowerCase().includes("empress") || character.roleTitle?.toLowerCase().includes("female lead")
    ? {
        label: character.roleTitle || "Heroine",
        badge: "bg-gradient-to-r from-rose-500/25 via-purple-600/25 to-pink-500/25 border-rose-400/50 text-rose-300 shadow-lg shadow-rose-500/20",
        borderGlow: "border-rose-500/40 shadow-rose-500/15",
        icon: <Heart className="h-4 w-4 text-rose-400" />,
        accentText: "text-rose-400",
      }
    : character.role === "ANTAGONIST" || character.roleTitle?.toLowerCase().includes("rival")
    ? {
        label: character.roleTitle || "Destined Rival",
        badge: "bg-gradient-to-r from-red-500/25 to-orange-500/25 border-red-400/50 text-red-300 shadow-lg shadow-red-500/20",
        borderGlow: "border-red-500/40 shadow-red-500/15",
        icon: <Flame className="h-4 w-4 text-red-400" />,
        accentText: "text-red-400",
      }
    : {
        label: character.roleTitle || "Core Supporting",
        badge: "bg-purple-950/50 border-purple-500/40 text-purple-300 shadow-lg shadow-purple-950/30",
        borderGlow: "border-purple-500/40 shadow-purple-950/20",
        icon: <Sparkles className="h-4 w-4 text-purple-400" />,
        accentText: "text-purple-400",
      };

  const realmDisplay =
    character.bioData?.cultivationRealm || character.bioData?.rank || character.bioData?.combatClass;

  return (
    <div className="min-h-screen bg-[#08080a] text-neutral-200">
      {/* ─── Breadcrumb Navigation Bar ──────────────────────────────────── */}
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between text-xs text-neutral-400">
          <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
            <Link
              href={`/title/${series.slug}`}
              className="hover:text-purple-300 transition-colors truncate max-w-[140px] sm:max-w-xs font-semibold"
            >
              {series.title}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
            <span className="text-white font-black truncate">{character.name}</span>
          </nav>

          <Link
            href={`/title/${series.slug}`}
            className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-purple-500/50 hover:text-white bg-neutral-900/80 transition-colors shrink-0 ml-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Series</span>
          </Link>
        </div>
      </header>

      {/* ─── Grand Atmospheric Hero Banner ───────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-purple-950/30 via-neutral-950/90 to-[#08080a] pb-12 pt-8">
        {/* Blurred Portrait Aura Backdrop */}
        {character.imageUrl && (
          <div
            className="absolute inset-0 opacity-15 blur-3xl scale-125 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: `url(${character.imageUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-start">
            {/* Character Portrait with Glowing Aura Frame */}
            <div className="flex flex-col items-center md:items-start space-y-4">
              <div
                className={`relative w-full max-w-[280px] md:max-w-none aspect-[4/5] rounded-3xl overflow-hidden border-2 bg-neutral-950 shadow-2xl transition-all duration-300 ${roleTheme.borderGlow}`}
              >
                {character.imageUrl ? (
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-t from-neutral-950 to-neutral-800 text-neutral-500 font-black text-5xl">
                    {character.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Deep bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent pointer-events-none" />

                {/* Top Role Badge */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-2xs uppercase font-black px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-md ${roleTheme.badge}`}
                  >
                    {roleTheme.icon}
                    <span className="truncate">{roleTheme.label}</span>
                  </Badge>
                </div>

                {/* Cultivation Realm / Rank Badge at bottom of card */}
                {realmDisplay && (
                  <div className="absolute bottom-3.5 left-3.5 right-3.5">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/90 border border-purple-400/40 text-xs font-black text-purple-300 backdrop-blur-md shadow-xl truncate max-w-full">
                      <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{realmDisplay}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Fandom / External Wiki Citation Link */}
              {character.sourceUrl && (
                <a
                  href={character.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-[280px] md:max-w-none flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-800 hover:border-purple-500/50 bg-neutral-900/60 hover:bg-neutral-800/80 text-xs font-bold text-neutral-300 hover:text-white transition-all shadow-md"
                >
                  <span>Read on Fandom Wiki</span>
                  <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
                </a>
              )}
            </div>

            {/* Character Header Information */}
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <Badge
                    variant="outline"
                    className="bg-purple-500/15 border-purple-500/40 text-purple-300 text-3xs uppercase font-bold tracking-wider px-2.5 py-1"
                  >
                    {series.title}
                  </Badge>
                  {character.bioData?.status && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/15 border-emerald-500/40 text-emerald-300 text-3xs font-semibold px-2.5 py-1"
                    >
                      Status: {character.bioData.status}
                    </Badge>
                  )}
                  {character.bioData?.affiliation && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/15 border-blue-500/40 text-blue-300 text-3xs font-semibold px-2.5 py-1"
                    >
                      {character.bioData.affiliation}
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  {character.name}
                </h1>

                {character.nativeName && (
                  <p className="text-xl sm:text-2xl text-neutral-400 font-semibold mt-1">
                    {character.nativeName}
                  </p>
                )}

                {/* Aliases Tag Cloud */}
                {character.aliases && character.aliases.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3.5">
                    <span className="text-3xs font-black text-neutral-500 uppercase tracking-wider">
                      Aliases & Titles:
                    </span>
                    {character.aliases.map((alias, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300 font-semibold"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── Cultivation & Lore Stats Matrix ──────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur-md shadow-xl">
                {character.bioData?.cultivationRealm && (
                  <div className="space-y-1">
                    <span className="text-3xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Cultivation Realm
                    </span>
                    <p className="text-xs font-bold text-white leading-snug">
                      {character.bioData.cultivationRealm}
                    </p>
                  </div>
                )}

                {character.bioData?.physique && (
                  <div className="space-y-1">
                    <span className="text-3xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Innate Physique
                    </span>
                    <p className="text-xs font-bold text-white leading-snug">
                      {character.bioData.physique}
                    </p>
                  </div>
                )}

                {character.bioData?.combatClass && (
                  <div className="space-y-1">
                    <span className="text-3xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <Swords className="h-3 w-3" /> Combat Mastery
                    </span>
                    <p className="text-xs font-bold text-white leading-snug">
                      {character.bioData.combatClass}
                    </p>
                  </div>
                )}

                {character.bioData?.affiliation && (
                  <div className="space-y-1">
                    <span className="text-3xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Sect & Clan
                    </span>
                    <p className="text-xs font-bold text-white leading-snug">
                      {character.bioData.affiliation}
                    </p>
                  </div>
                )}

                {character.bioData?.firstAppearance && (
                  <div className="space-y-1">
                    <span className="text-3xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <Scroll className="h-3 w-3" /> Story Debut
                    </span>
                    <p className="text-xs font-bold text-neutral-300 leading-snug">
                      {character.bioData.firstAppearance}
                    </p>
                  </div>
                )}

                {character.bioData?.gender && (
                  <div className="space-y-1">
                    <span className="text-3xs font-black uppercase tracking-wider text-neutral-400">
                      Gender
                    </span>
                    <p className="text-xs font-bold text-neutral-300 leading-snug">
                      {character.bioData.gender}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={`/title/${series.slug}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50 transition-all"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Read Chapter 1 of {series.title}</span>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpoilers(!showSpoilers)}
                  className="text-xs font-bold border-amber-500/40 text-amber-300 hover:bg-amber-950/40 h-9 px-3.5 rounded-xl cursor-pointer"
                >
                  {showSpoilers ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Hide Story Spoilers
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Reveal Story Spoilers
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Navigation Tabs Bar ────────────────────────────────────────── */}
      <nav className="border-b border-white/5 bg-neutral-950 sticky top-12 z-30">
        <div className="container mx-auto px-4 max-w-6xl flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
          <button
            onClick={() => setActiveTab("LORE")}
            className={`text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "LORE"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Overview & Lore</span>
          </button>

          <button
            onClick={() => setActiveTab("CULTIVATION")}
            className={`text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "CULTIVATION"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Cultivation & Martial Arts</span>
          </button>

          <button
            onClick={() => setActiveTab("BONDS")}
            className={`text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "BONDS"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            <HeartHandshake className="h-4 w-4" />
            <span>Story Bonds ({character.relationships?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("TRIVIA")}
            className={`text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "TRIVIA"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Quotes & Trivia</span>
          </button>
        </div>
      </nav>

      {/* ─── Main Content Tabs ─────────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-8 space-y-10 max-w-6xl">
        {/* TAB 1: OVERVIEW & LORE */}
        {activeTab === "LORE" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Detailed Character Overview */}
            <div className="space-y-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                <span>Character Dossier & Biography</span>
              </h3>
              <div className="text-sm leading-relaxed text-neutral-300 space-y-3 bg-neutral-950/60 p-6 rounded-2xl border border-white/5 shadow-lg">
                {character.description && <FormattedText text={character.description} />}
                {character.background && (
                  <div className="pt-3 border-t border-white/5 space-y-1">
                    <strong className="text-purple-400 text-xs font-black uppercase tracking-wider block">
                      Background Origins:
                    </strong>
                    <p className="text-neutral-300 leading-relaxed">{character.background}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Continuous Story Significance Box */}
            {character.storySignificance && (
              <div className="p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-neutral-950 to-neutral-950 space-y-2 shadow-xl">
                <h4 className="text-sm font-black text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span>Continuous Story Impact & Narrative Role</span>
                </h4>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {character.storySignificance}
                </p>
              </div>
            )}

            {/* Personality & Mental Facets */}
            {character.personality && (
              <div className="space-y-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Compass className="h-4 w-4 text-purple-400" />
                  <span>Personality & Worldview</span>
                </h3>
                <div className="text-xs sm:text-sm leading-relaxed text-neutral-300 bg-neutral-950/60 p-5 rounded-2xl border border-white/5 shadow-md">
                  {character.personality}
                </div>
              </div>
            )}

            {/* Spoiler Progression Notice / Drawer */}
            {character.spoilerSummary && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Future Plot Progression & Spoilers</span>
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSpoilers(!showSpoilers)}
                    className="text-xs font-bold border-amber-500/40 text-amber-300 hover:bg-amber-950/40 h-8 px-3 rounded-xl cursor-pointer"
                  >
                    {showSpoilers ? "Hide Spoilers" : "Reveal Spoilers"}
                  </Button>
                </div>

                {showSpoilers ? (
                  <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs sm:text-sm text-amber-200 leading-relaxed animate-in fade-in">
                    {character.spoilerSummary}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/40 text-xs text-neutral-400 flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      Late-novel progression and major spoiler events are concealed. Click "Reveal Spoilers" above if you wish to read ahead.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CULTIVATION & MARTIAL ARTS */}
        {activeTab === "CULTIVATION" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Techniques & Divine Arts */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-400" />
                <span>Martial Arts, Divine Arts & Techniques</span>
              </h3>

              {character.bioData?.abilities && character.bioData.abilities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {character.bioData.abilities.map((ability, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 flex items-center gap-3 shadow-md"
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/20 text-purple-300 font-black text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-white">{ability}</h5>
                        <span className="text-3xs text-purple-300/80 font-medium">
                          Mastered Divine Art
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 text-xs text-neutral-400 italic">
                  Specific martial techniques for this character are unfolding in current story chapters.
                </div>
              )}
            </div>

            {/* Divine Weapons & Sacred Artifacts */}
            {character.bioData?.weapons && character.bioData.weapons.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Swords className="h-4 w-4 text-amber-400" />
                  <span>Divine Artifacts & Sacred Armaments</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {character.bioData.weapons.map((weapon, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center gap-3 shadow-md"
                    >
                      <Swords className="h-5 w-5 text-amber-400 shrink-0" />
                      <div>
                        <h5 className="font-bold text-sm text-amber-200">{weapon}</h5>
                        <span className="text-3xs text-amber-300/80 font-medium">
                          Supreme Armament / Artifact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RELATIONSHIP NETWORK */}
        {activeTab === "BONDS" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-purple-400" />
                  <span>Character Relationship Web</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Dynamics, alliances, rivalries, and fated bonds with other characters
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSpoilers(!showSpoilers)}
                className="text-xs font-bold border-amber-500/40 text-amber-300 hover:bg-amber-950/40 h-8 px-3 rounded-xl cursor-pointer self-start sm:self-auto"
              >
                {showSpoilers ? "Conceal Secret Bonds" : "Reveal Spoiler Bonds"}
              </Button>
            </div>

            {character.relationships && character.relationships.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {character.relationships.map((rel, idx) => {
                  const targetCharacter = otherCharacters.find(
                    (c) => c.slug === rel.slug || c.name.toLowerCase() === rel.name.toLowerCase()
                  );
                  const isHidden = rel.isSpoiler && !showSpoilers;

                  const cardContent = (
                    <div
                      className={`p-4 rounded-2xl border transition-all duration-300 space-y-2 h-full flex flex-col justify-between ${
                        targetCharacter
                          ? "border-white/10 bg-neutral-950/80 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/30"
                          : "border-neutral-800 bg-neutral-950/50"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{rel.name}</span>
                            {targetCharacter && (
                              <ArrowRight className="h-3 w-3 text-purple-400" />
                            )}
                          </h4>
                          <Badge
                            variant="outline"
                            className="bg-purple-500/15 border-purple-500/40 text-purple-300 text-3xs font-bold shrink-0"
                          >
                            {rel.relationType}
                          </Badge>
                        </div>

                        {isHidden ? (
                          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-3xs text-amber-300/80 flex items-center gap-1.5 font-medium">
                            <Lock className="h-3 w-3 text-amber-400 shrink-0" />
                            <span>Confidential relationship locked (Spoiler)</span>
                          </div>
                        ) : (
                          rel.description && (
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              {rel.description}
                            </p>
                          )
                        )}
                      </div>

                      {targetCharacter && (
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-3xs font-bold text-purple-400">
                          <span>View {rel.name}&apos;s Profile</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );

                  if (targetCharacter) {
                    return (
                      <Link
                        key={idx}
                        href={`/title/${series.slug}/character/${targetCharacter.slug}`}
                        className="block"
                      >
                        {cardContent}
                      </Link>
                    );
                  }

                  return <div key={idx}>{cardContent}</div>;
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 text-xs text-neutral-400 text-center italic">
                No recorded external relationships for this character yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: QUOTES & TRIVIA */}
        {activeTab === "TRIVIA" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Character Quotes */}
            {character.quotes && character.quotes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Quote className="h-5 w-5 text-amber-400" />
                  <span>Memorable Quotes & Proclamations</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {character.quotes.map((quote, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-neutral-950 text-amber-100 text-xs sm:text-sm italic leading-relaxed shadow-lg relative"
                    >
                      <Quote className="h-6 w-6 text-amber-500/20 absolute top-3 right-3" />
                      &ldquo;{quote}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Character Trivia */}
            {character.trivia && character.trivia.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Compass className="h-4 w-4 text-purple-400" />
                  <span>Lore Secrets & Trivia</span>
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {character.trivia.map((fact, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-white/5 bg-neutral-950/60 flex items-start gap-3 text-xs text-neutral-300"
                    >
                      <div className="h-2 w-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Bottom Carousel: More Characters from Series ──────────────── */}
        {otherCharacters.length > 0 && (
          <div className="space-y-4 pt-10 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-white tracking-tight">
                  More Key Characters from {series.title}
                </h2>
              </div>
              <Link
                href={`/title/${series.slug}`}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                View Series Hub →
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {otherCharacters.map((c) => (
                <Link
                  key={c.id}
                  href={`/title/${series.slug}/character/${c.slug}`}
                  className="flex-shrink-0 w-36 sm:w-44 rounded-2xl overflow-hidden border border-white/10 bg-neutral-950/90 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/40 transition-all duration-300 group"
                >
                  <div className="aspect-[4/5] w-full bg-neutral-950 overflow-hidden relative">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 font-bold text-lg">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-black text-white truncate group-hover:text-purple-300 transition-colors">
                      {c.name}
                    </p>
                    <p className="text-3xs text-purple-400 font-semibold truncate">
                      {c.roleTitle || (c.role === "MAIN" ? "Protagonist" : "Supporting")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
