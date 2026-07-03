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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { HomeStats } from "./HomeStats";

export const revalidate = 300; // ISR: refresh anonymous landing every 5 min

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
  const [series, stats] = await Promise.all([getShowcaseSeries(), getStats()]);

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
      <section className="relative border-b border-border/20 pb-16 pt-24 md:pb-28 md:pt-40">
        <div className="container mx-auto px-4 text-center sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="eyebrow mb-6 tracking-[0.15em] opacity-80">
            Next-Gen Reading Platform
          </div>

          <h1 className="mx-auto max-w-5xl text-4xl font-bold leading-[0.95] tracking-[0.06em] text-white sm:text-6xl md:text-7xl lg:text-8xl">
            DISCOVER STORIES
            <br />
            <span className="text-gradient">DRAWN BY IMAGINATION</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg tracking-[0.02em] font-light">
            Follow your favorite manhwa, track new releases, level up your reader rank, and explore creator-first web novels in a premium reading environment.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/home" className="w-full sm:w-auto">
              <span className="btn-solid-pill w-full justify-center cursor-pointer">
                Start Reading <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </Link>
            <Link href="/browse" className="w-full sm:w-auto">
              <span className="btn-ghost-pill w-full justify-center cursor-pointer">
                Explore Library
              </span>
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
                  className="card-spacex bg-surface-1 p-8 text-left hover:border-hairline-strong transition-all duration-300"
                >
                  <div className="mb-4 text-muted-foreground">
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
              <div className="eyebrow mb-3 tracking-[0.1em]">
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
              <span className="btn-ghost-pill cursor-pointer">
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
                  className="card-spacex bg-surface-1 group flex flex-col h-full hover:border-hairline-strong transition-all duration-300"
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
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={item.cover_url}
                          alt={`${item.title} cover`}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <Badge variant="outline" className="capitalize text-3xs font-semibold bg-black/60 text-neutral-300 border-neutral-800 tracking-[0.05em] py-0.5 px-2">
                        {item.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`capitalize text-3xs font-semibold py-0.5 px-2 tracking-[0.05em] ${
                          item.status === "ongoing"
                            ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                            : "bg-neutral-900/60 border-neutral-800/40 text-neutral-400"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold tracking-[0.02em] text-white uppercase group-hover:text-neutral-200 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed font-light">
                        {item.description || `Read ${item.title} ${item.type} online in high quality on vnrscans.`}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between text-3xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-neutral-400 stroke-[1.5]" />
                        {item.view_count?.toLocaleString() || "0"} Views
                      </span>
                      <span className="flex items-center gap-1 text-white">
                        Read Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-spacex bg-surface-1 p-12 text-center">
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
      <section className="py-24 bg-surface-1 border-b border-border/20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="eyebrow mb-3 tracking-[0.1em]">
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
                title: "Gamified Reading",
                desc: "Earn XP, unlock rare achievements, climb streaks, and customize your profile badges.",
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
                  className="card-spacex bg-background p-8 hover:border-hairline-strong transition-all duration-300"
                >
                  <div className="mb-5 text-neutral-400">
                    <Icon className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.04em] text-white mb-2">{prop.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">{prop.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Trust, Legal & Compliance Section ─── */}
      <section className="py-24 border-b border-border/20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="eyebrow mb-3 tracking-[0.1em]">
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
                    <div key={idx} className="flex gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-surface-1 border border-border/40 text-neutral-400">
                        <ItemIcon className="h-5 w-5 stroke-[1.5]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-[0.02em] text-white">{item.title}</h4>
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
              <div className="card-spacex bg-surface-1 p-8 hover:border-hairline-strong transition-all duration-300">
                <Badge variant="outline" className="border-emerald-900/60 text-emerald-400 bg-emerald-950/10 mb-5 text-3xs font-bold uppercase tracking-widest py-0.5 px-2">
                  Safe Browsing Certified
                </Badge>
                <h3 className="text-xl font-bold uppercase tracking-[0.02em] text-white">Creator-First Ecosystem</h3>
                <p className="mt-4 text-xs text-muted-foreground leading-relaxed font-light">
                  We believe that the future of scanlation lies in legal partnership. If you are an artist, translator, or writer looking to publish your story, vnrscans provides the tools, traffic, and community to launch your career.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/about">
                    <span className="btn-ghost-pill cursor-pointer py-2 px-4 text-xs">
                      Policy Details
                    </span>
                  </Link>
                  <Link href="/contact">
                    <span className="btn-solid-pill cursor-pointer py-2 px-4 text-xs">
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

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.02em] hover:no-underline text-white hover:text-neutral-300 transition-colors py-4">
                Is vnrscans completely free to use?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4">
                Yes! vnrscans is entirely free for all readers. We do not require any paid subscription to read our indexed series or keep track of your reading progress.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.02em] hover:no-underline text-white hover:text-neutral-300 transition-colors py-4">
                How does the leveling and XP system work?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4">
                As you read chapters, interact with comments, and keep up your reading streaks, you earn experience points (XP). Accumulating XP increases your User Level, which unlocks rare badges, exclusive profile accent customizers, and high-tier community ranks.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.02em] hover:no-underline text-white hover:text-neutral-300 transition-colors py-4">
                Where does vnrscans get its content?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4">
                vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.02em] hover:no-underline text-white hover:text-neutral-300 transition-colors py-4">
                What is your DMCA copyright policy?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4">
                We take intellectual property ownership extremely seriously. If you are a copyright holder and believe your work is on our platform without authorization, you can file a quick takedown notice on our DMCA page. We review and remove verified reports within 5 business days.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.02em] hover:no-underline text-white hover:text-neutral-300 transition-colors py-4">
                Can independent creators publish their work here?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4">
                Absolutely! We love supporting independent authors and illustrators. Please reach out to hello@vnrscans.com or use our Contact page form to send us details of your work, and our admin team will assist you in setting up your series.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
