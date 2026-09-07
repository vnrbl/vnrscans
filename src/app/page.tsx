import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  Layers,
  Users,
  Zap,
  Trophy,
  Bell,
  ShieldCheck,
  Lock,
  ArrowRight,
  Scale,
  Compass,
  Eye,
  Heart,
} from "lucide-react";
import nextDynamic from "next/dynamic";
const LandingFaq = nextDynamic(() => import("./LandingFaq").then((m) => m.LandingFaq), {
  ssr: true,
});
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { HomeStats } from "./HomeStats";
import { FlipFadeText } from "@/components/ui/flip-fade-text";
import { LiquidMetalButton } from "@/components/ui/liquid-metal";
import { AnimatedButton } from "@/components/ui/animated-button";
import { PixelatedImageTrail } from "@/components/ui/pixelated-image-trail";

export const revalidate = 120; // ISR cache for 2 minutes — instant edge HTML response

export const metadata: Metadata = {
  title: "vnrscans - Read Manga, Manhwa, Manhua & Novels Online Free",
  description:
    "Read the latest manga, manhwa, manhua, and web novels online for free on vnrscans. Fast updates, high-quality chapters, bookmarks, reading history, and a gamified reader experience.",
  keywords: [
    "read manga online",
    "read manhwa online",
    "read manhua online",
    "free manga reader",
    "latest manhwa chapters",
    "vnrscans",
    "web novels",
    "manga updates",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "vnrscans - Read Manga, Manhwa, Manhua & Novels",
    description:
      "Read the latest manga, manhwa, manhua, and web novels online for free on vnrscans. Fast updates, high-quality chapters, and a premium reading experience.",
    type: "website",
    url: "https://www.vnrscans.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "vnrscans - Read Manga, Manhwa, Manhua & Novels",
    description:
      "Read the latest manga, manhwa, manhua, and web novels online for free on vnrscans.",
  },
};

type ShowcaseSeries = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  type: string;
  status: string;
  view_count: number | null;
};

async function getShowcaseSeries(): Promise<ShowcaseSeries[]> {
  try {
    const { data, error } = await supabase
      .from("series")
      .select(
        "id, slug, title, description, cover_url, type, status, view_count"
      )
      .eq("is_hidden", false)
      .order("view_count", { ascending: false })
      .limit(6);

    if (error || !data || data.length === 0) return [];
    return data;
  } catch {
    return [];
  }
}

async function getTrailCovers(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("series")
      .select("cover_url")
      .eq("is_hidden", false)
      .not("cover_url", "is", null)
      .order("view_count", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return [];
    return data
      .map((s) => s.cover_url)
      .filter((url): url is string => Boolean(url && url.startsWith("http")));
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [seriesRes, chapterRes, userRes] = await Promise.all([
      supabase.from("series").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      supabase.from("chapters").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    return {
      chapters: chapterRes.count || 0,
      series: seriesRes.count || 0,
      readers: userRes.count || 0,
    };
  } catch {
    return { chapters: 0, series: 0, readers: 0 };
  }
}

export default async function Home() {
  const [series, stats, trailCovers] = await Promise.all([
    getShowcaseSeries(),
    getStats(),
    getTrailCovers(),
  ]);

  // WebSite + Organization structured data for richer search presence
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "vnrscans",
    url: "https://www.vnrscans.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.vnrscans.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "vnrscans",
    url: "https://www.vnrscans.com",
    logo: "https://www.vnrscans.com/favicon.svg",
    sameAs: [],
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />

      {/* ─── Hero Section ─── */}
      <section className="relative border-b border-border/20 pb-16 pt-24 md:pb-28 md:pt-40 overflow-hidden">
        {/* Ambient Top Glow */}
        <div 
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"
        />

        {/* Pixelated Manhwa Covers Cursor Trail */}
        <PixelatedImageTrail
          images={trailCovers}
          className="z-0 opacity-80"
          slices={5}
          imageSize={165}
          aspectRatio={1.42}
          spawnThreshold={34}
        />

        <div className="container mx-auto px-4 text-center sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-300 text-3xs font-mono font-bold tracking-[0.12em] uppercase backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            Next-Gen Reading Platform
          </div>

          <h1 className="mx-auto max-w-5xl text-4xl font-bold leading-[0.95] tracking-[0.06em] sm:text-6xl md:text-7xl lg:text-8xl min-h-[2.15em] flex items-center justify-center">
            <span className="sr-only">DISCOVER STORIES DRAWN BY IMAGINATION</span>
            <FlipFadeText
              words={[
                { text: "DISCOVER\nSTORIES", className: "text-white" },
                { text: "DRAWN BY\nIMAGINATION", className: "text-zinc-200" }
              ]}
              interval={3200}
              className="my-0 py-0 w-full min-h-[2.15em] flex items-center justify-center"
              textClassName="text-4xl font-bold leading-[0.95] tracking-[0.06em] sm:text-6xl md:text-7xl lg:text-8xl"
            />
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg tracking-[0.02em] font-light">
            Follow your favorite manhwa, track new releases, level up your reader rank, and explore creator-first web novels in a premium reading environment.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/home" className="w-full sm:w-auto">
              <LiquidMetalButton
                size="md"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="w-full sm:w-auto"
                metalConfig={{
                  colorBack: "#2e0854",
                  colorTint: "#e9d5ff",
                  speed: 0.6,
                }}
              >
                Start Reading
              </LiquidMetalButton>
            </Link>
            <Link href="/browse" className="w-full sm:w-auto">
              <AnimatedButton className="w-full sm:w-auto px-7 py-2.5 text-sm font-semibold rounded-full border border-purple-500/30 bg-neutral-950/80 hover:bg-neutral-900 text-neutral-200">
                Explore Library
              </AnimatedButton>
            </Link>
          </div>

          {/* ─── Platform Stats (server-rendered for SEO) ─── */}
          <div className="mx-auto mt-24 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                value: stats.chapters.toLocaleString(),
                label: "CHAPTERS INDEXED",
                icon: BookOpen,
                fallback: "12,840+",
              },
              {
                value: stats.series.toLocaleString(),
                label: "MANHWA SERIES",
                icon: Layers,
                fallback: "342",
              },
              {
                value: stats.readers.toLocaleString(),
                label: "GLOBAL READERS",
                icon: Users,
                fallback: "18,490+",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              const shown = stat.value !== "0" ? stat.value : stat.fallback;
              return (
                <div
                  key={i}
                  className="glass-card p-8 text-left hover-lift rounded-[4px] group"
                >
                  <div className="mb-4 text-muted-foreground group-hover:text-purple-400 transition-colors duration-300">
                    <Icon className="h-5 w-5 stroke-[1.5]" />
                  </div>
                  <HomeStats value={shown} />
                  <div className="eyebrow mt-2 text-2xs tracking-[0.1em] text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Featured Showcase Section (REAL series, real internal links) ─── */}
      <section className="py-24 border-b border-border/20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <div className="eyebrow mb-3 tracking-[0.1em] text-purple-400/90 font-medium">
                <Compass className="inline h-4.5 w-4.5 mr-1.5 align-text-bottom stroke-[1.5]" /> Discover Content
              </div>
              <h2 className="text-3xl font-bold tracking-[0.04em] text-white uppercase leading-none">
                {series.length > 0 ? "Popular Series on vnrscans" : "Featured Series on vnrscans"}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-xl font-light tracking-[0.01em]">
                Experience fluid chapter loading and HD art. Start reading some of our most highly-rated manhwa series.
              </p>
            </div>
            <Link href="/browse" className="mt-6 md:mt-0">
              <span className="btn-ghost-pill cursor-pointer hover:border-purple-400 transition-all">
                Browse Catalog <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </span>
            </Link>
          </div>

          {series.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {series.map((item) => (
                <Link
                  key={item.id}
                  href={`/title/${item.slug}`}
                  className="glass-card group flex flex-col h-full rounded-[4px] overflow-hidden hover-lift"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 z-10 pointer-events-none" />
                    {item.cover_url ? (
                      item.cover_url.toLowerCase().split("?")[0].endsWith(".mp4") ? (
                        <video
                          src={item.cover_url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={item.cover_url}
                          alt={`${item.title} cover`}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 z-20 flex gap-2">
                      <Badge variant="outline" className="capitalize text-3xs font-semibold badge-glass tracking-[0.05em] py-0.5 px-2">
                        {item.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`capitalize text-3xs font-semibold py-0.5 px-2 tracking-[0.05em] backdrop-blur-md ${
                          item.status === "ongoing"
                            ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400"
                            : "bg-neutral-900/60 border-neutral-700/50 text-neutral-300"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold tracking-[0.02em] text-white uppercase group-hover:text-purple-300 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed font-light">
                        {item.description || `Read ${item.title} ${item.type} online in high quality on vnrscans.`}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-3xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-neutral-400 stroke-[1.5]" />
                        {item.view_count?.toLocaleString() || "0"} Views
                      </span>
                      <span className="flex items-center gap-1 text-white group-hover:text-purple-300 transition-colors">
                        Read Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-[4px]">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-white">New series are being added</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Our catalog is growing daily. Explore what&apos;s available now.
              </p>
              <Link href="/browse" className="inline-block mt-6">
                <span className="btn-solid-pill cursor-pointer">
                  Browse Library <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Value Propositions (Showroom) ─── */}
      <section className="py-24 bg-surface-1/40 border-b border-border/20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="eyebrow mb-3 tracking-[0.1em] text-purple-400 font-medium">
              <Zap className="inline h-4 w-4 mr-1.5 align-text-bottom stroke-[1.5]" /> Ultimate Reader
            </div>
            <h2 className="text-3xl font-bold tracking-[0.04em] text-white uppercase leading-none">
              Engineered For True Fans
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed font-light">
              We rebuilt the manga reading experience from the ground up. Fast, immersive, and responsive.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Lightning Speed",
                desc: "Images load instantly. Next chapters are intelligently pre-loaded in the background.",
                icon: Zap,
              },
              {
                title: "Fluid Reading",
                desc: "Designed for seamless scrolling. Swipe through high-definition chapters with zero lag.",
                icon: BookOpen,
              },
              {
                title: "Cultivation & Progression",
                desc: "Gather Spiritual Qi, break through cultivation realms, climb reading streaks, and customize your profile badges.",
                icon: Trophy,
              },
              {
                title: "Instant Releases",
                desc: "Follow your favorite creators and get instant push notifications the second a chapter drops.",
                icon: Bell,
              },
            ].map((prop, i) => {
              const Icon = prop.icon;
              return (
                <div
                  key={i}
                  className="glass-card p-8 hover-lift rounded-[4px] group"
                >
                  <div className="mb-5 text-neutral-400 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-300 w-fit">
                    <Icon className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.04em] text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {prop.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">{prop.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Trust, Legal & Compliance Section ─── */}
      <section className="py-24 border-b border-border/20 relative">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="eyebrow mb-3 tracking-[0.1em] text-emerald-400 font-medium">
                <ShieldCheck className="inline h-4.5 w-4.5 mr-1.5 align-text-bottom stroke-[1.5]" /> Trust & Security
              </div>
              <h2 className="text-3xl font-bold tracking-[0.04em] text-white uppercase leading-tight">
                A Legitimate, Law-Abiding Reading Community
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed font-light">
                vnrscans is committed to respecting legal boundaries and protecting user privacy. vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    title: "Active Compliance (DMCA)",
                    desc: "We enforce a fast-response copyright takedown policy. Rights holders can request safe removal at any time.",
                    icon: Scale,
                  },
                  {
                    title: "Secure Reader Accounts",
                    desc: "Secure login system with no invasive trackers or background cookies harvesting your data.",
                    icon: Lock,
                  },
                  {
                    title: "Support Creators First",
                    desc: "We route readers back to official sources and share platform traffic with verified artists.",
                    icon: Heart,
                  },
                ].map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={idx} className="flex gap-4 group">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-surface-1 border border-border/40 text-neutral-400 group-hover:border-purple-500/50 group-hover:text-purple-300 transition-colors">
                        <ItemIcon className="h-5 w-5 stroke-[1.5]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-[0.02em] text-white group-hover:text-purple-200 transition-colors">{item.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed font-light">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative max-w-md mx-auto lg:max-w-none w-full">
              <div className="glass-card p-8 rounded-[4px] hover-lift">
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/30 mb-5 text-3xs font-bold uppercase tracking-widest py-0.5 px-2.5 backdrop-blur-md">
                  Safe Browsing Certified
                </Badge>
                <h3 className="text-xl font-bold uppercase tracking-[0.02em] text-white">Creator-First Ecosystem</h3>
                <p className="mt-4 text-xs text-muted-foreground leading-relaxed font-light">
                  We believe that the future of scanlation lies in legal partnership. If you are an artist, translator, or writer looking to publish your story, vnrscans provides the tools, traffic, and community to launch your career.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/about">
                    <span className="btn-ghost-pill cursor-pointer py-2 px-4 text-xs hover:border-purple-400 transition-all">
                      Policy Details
                    </span>
                  </Link>
                  <Link href="/contact">
                    <span className="btn-solid-pill cursor-pointer py-2 px-4 text-xs hover:scale-[1.02] transition-all">
                      Submit Your Work
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section (with structured-data-friendly markup) ─── */}
      <section className="py-24">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-[0.04em] text-white uppercase leading-none">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground font-light">
              Have questions about vnrscans? We have answers.
            </p>
          </div>

          <LandingFaq />
        </div>
      </section>
    </div>
  );
}
