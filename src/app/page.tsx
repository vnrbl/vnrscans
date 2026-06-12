"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import Link from "next/link";

export default function Home() {
  // Fetch stats from Supabase
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [seriesRes, chapterRes, userRes] = await Promise.all([
        supabase.from("series").select("*", { count: "exact", head: true }),
        supabase.from("chapters").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      return {
        chapters: chapterRes.count || 0,
        series: seriesRes.count || 0,
        readers: userRes.count || 0,
      };
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch popular series for showcase
  const popularSeries = useQuery({
    queryKey: ["showcase-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, slug, title, cover_url, description, type, status, view_count")
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  // Mock series data as fallback if no series exist in DB yet
  const mockSeries = [
    {
      id: "mock-1",
      slug: "solo-leveling-ragnarok",
      title: "Solo Leveling: Ragnarok",
      description: "The official sequel to Solo Leveling. Earth's peace is shattered once again, and Sung Suho must rise to save humanity.",
      cover_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80",
      type: "manhwa",
      status: "ongoing",
      view_count: 84729,
    },
    {
      id: "mock-2",
      slug: "omniscient-readers-viewpoint",
      title: "Omniscient Reader's Viewpoint",
      description: "Only one reader knows the ending of the novel that has suddenly become reality. Can he survive the scenarios?",
      cover_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
      type: "manhwa",
      status: "ongoing",
      view_count: 95821,
    },
    {
      id: "mock-3",
      slug: "return-of-the-mount-hua-sect",
      title: "Return of the Mount Hua Sect",
      description: "Chung Myung, the 13th Disciple of the Mount Hua Sect, wakes up 100 years in the future to find his sect in ruins.",
      cover_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
      type: "manhwa",
      status: "ongoing",
      view_count: 73942,
    },
  ];

  const displaySeries = popularSeries.data && popularSeries.data.length > 0
    ? popularSeries.data
    : mockSeries;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Hero Section ─── */}
      <section className="relative border-b border-border/20 pb-16 pt-24 md:pb-28 md:pt-40">
        <div className="container mx-auto px-4 text-center sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="eyebrow mb-6 tracking-[0.15em] opacity-80">
            Next-Gen Reading Platform
          </div>

          <h1 className="mx-auto max-w-5xl text-4xl font-bold leading-[0.95] tracking-[0.06em] text-white sm:text-6xl md:text-7xl lg:text-8xl">
            DISCOVER STORIES
            <br />
            <span className="text-gradient">
              DRAWN BY IMAGINATION
            </span>
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

          {/* ─── Platform Stats ─── */}
          <div className="mx-auto mt-24 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                value: stats.data?.chapters.toLocaleString() || "12,840+",
                label: "CHAPTERS INDEXED",
                icon: BookOpen,
              },
              {
                value: stats.data?.series.toLocaleString() || "342",
                label: "MANHWA SERIES",
                icon: Layers,
              },
              {
                value: stats.data?.readers.toLocaleString() || "18,490+",
                label: "GLOBAL READERS",
                icon: Users,
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="card-spacex bg-surface-1 p-8 text-left hover:border-hairline-strong transition-all duration-300"
                >
                  <div className="mb-4 text-muted-foreground">
                    <Icon className="h-5 w-5 stroke-[1.5]" />
                  </div>
                  <div className="text-3xl font-bold tracking-[0.02em] text-white">
                    {stat.value}
                  </div>
                  <div className="eyebrow mt-2 text-2xs tracking-[0.1em] text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Featured Showcase Section ─── */}
      <section className="py-24 border-b border-border/20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <div className="eyebrow mb-3 tracking-[0.1em]">
                <Compass className="inline h-4.5 w-4.5 mr-1.5 align-text-bottom stroke-[1.5]" /> Discover Content
              </div>
              <h2 className="text-3xl font-bold tracking-[0.04em] text-white uppercase leading-none">
                Featured Series on vnrscans
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displaySeries.map((series) => (
              <div
                key={series.id}
                className="card-spacex bg-surface-1 group flex flex-col h-full hover:border-hairline-strong transition-all duration-300"
              >
                {/* Cover Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 z-10 pointer-events-none" />
                  <img
                    src={series.cover_url || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500"}
                    alt={series.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <Badge variant="outline" className="capitalize text-3xs font-semibold bg-black/60 text-neutral-300 border-neutral-800 tracking-[0.05em] py-0.5 px-2">
                      {series.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`capitalize text-3xs font-semibold py-0.5 px-2 tracking-[0.05em] ${
                        series.status === "ongoing"
                          ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                          : "bg-neutral-900/60 border-neutral-800/40 text-neutral-400"
                      }`}
                    >
                      {series.status}
                    </Badge>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold tracking-[0.02em] text-white uppercase group-hover:text-neutral-200 transition-colors line-clamp-1">
                      {series.title}
                    </h3>
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed font-light">
                      {series.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between text-3xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-neutral-400 stroke-[1.5]" />
                      {series.view_count?.toLocaleString() || "0"} Views
                    </span>
                    <Link href={`/title/${series.slug || series.id}`}>
                      <span className="flex items-center gap-1 text-white hover:underline cursor-pointer">
                        Read Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

            {/* Visual Trust Callout Block */}
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

      {/* ─── FAQ Section ─── */}
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
