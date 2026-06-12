"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  Sparkles,
  Heart,
  Scale,
  Compass,
  Star,
  Eye,
} from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  // Inject keyframe animation styles
  useEffect(() => {
    const keyframeStyles = `
      @keyframes float-slow {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(1deg); }
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.15; filter: blur(50px); }
        50% { opacity: 0.25; filter: blur(70px); }
      }
      .animate-float-slow {
        animation: float-slow 6s ease-in-out infinite;
      }
      .animate-pulse-glow {
        animation: pulse-glow 8s ease-in-out infinite;
      }
    `;
    const style = document.createElement("style");
    style.textContent = keyframeStyles;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

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
      {/* Glow backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px] animate-pulse-glow pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[120px] animate-pulse-glow pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* ─── Hero Section ─── */}
      <section className="relative border-b border-border/20 pb-14 pt-20 sm:pb-16 sm:pt-24 md:pb-24 md:pt-36">
        <div className="container mx-auto px-4 text-center sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4.5 py-1.5 backdrop-blur-md">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Next-Gen Reading Platform
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl bg-gradient-to-b from-foreground via-foreground to-muted-foreground/60 bg-clip-text text-4xl font-extrabold leading-[1.08] tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-8xl">
            DISCOVER STORIES
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              DRAWN BY IMAGINATION
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-8 sm:text-lg md:text-xl">
            Follow your favorite manhwa, track new releases, level up your reader rank, and explore creator-first web novels in a premium reading environment.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/home" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-12 w-full rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_4px_25px_rgba(174,103,250,0.3)] transition-all hover:translate-y-[-2px] hover:bg-primary/95 sm:w-auto sm:px-8"
              >
                Start Reading <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/browse" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-xl border-border bg-card/40 px-5 text-sm font-bold backdrop-blur transition-all hover:translate-y-[-2px] hover:bg-card/85 hover:text-white sm:w-auto sm:px-8"
              >
                Explore Library
              </Button>
            </Link>
          </div>

          {/* ─── Platform Stats ─── */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                value: stats.data?.chapters.toLocaleString() || "12,840+",
                label: "CHAPTERS INDEXED",
                icon: BookOpen,
                color: "var(--primary)",
              },
              {
                value: stats.data?.series.toLocaleString() || "342",
                label: "MANHWA SERIES",
                icon: Layers,
                color: "var(--accent)",
              },
              {
                value: stats.data?.readers.toLocaleString() || "18,490+",
                label: "GLOBAL READERS",
                icon: Users,
                color: "#F59E0B",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/30 p-6.5 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/50"
                >
                  <div
                    className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-xl transition-all group-hover:scale-110"
                    style={{ backgroundColor: stat.color }}
                  />
                  <div
                    className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-card border border-border/40 group-hover:scale-105 transition-transform"
                    style={{ color: stat.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-2xs font-bold text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Featured Showcase Section ─── */}
      <section className="py-20 md:py-28 border-b border-border/20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent mb-3">
                <Compass className="h-4 w-4" /> Discover Content
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Featured Series on vnrscans
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Start reading some of our most highly-rated manhwa series. Experience fluid chapter loading and HD art.
              </p>
            </div>
            <Link href="/browse" className="mt-4 md:mt-0">
              <Button variant="ghost" className="text-primary hover:text-primary/80 group">
                Browse Full Catalog
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displaySeries.map((series) => (
              <Card
                key={series.id}
                className="group overflow-hidden border-border/30 bg-card/25 hover:bg-card/45 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full rounded-2xl"
              >
                {/* Cover Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60 z-10" />
                  <img
                    src={series.cover_url || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500"}
                    alt={series.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 z-20 flex gap-2">
                    <Badge variant="secondary" className="capitalize text-3xs font-semibold backdrop-blur bg-black/45 text-white border-border/10">
                      {series.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`capitalize text-3xs font-semibold ${
                        series.status === "ongoing"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-zinc-500/10 border-zinc-500/30 text-zinc-400"
                      }`}
                    >
                      {series.status}
                    </Badge>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold group-hover:text-primary transition-colors line-clamp-1">
                      {series.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {series.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border/20 flex items-center justify-between text-3xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-accent" />
                      {series.view_count?.toLocaleString() || "0"} Views
                    </span>
                    <Link href={`/title/${series.slug || series.id}`}>
                      <span className="flex items-center gap-0.5 text-primary hover:text-primary-active cursor-pointer hover:underline">
                        Read Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Value Propositions (Showroom) ─── */}
      <section className="py-20 md:py-28 bg-secondary/5 border-b border-border/20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary mb-3">
              <Sparkles className="h-4 w-4" /> Ultimate Reader
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Engineered For True Fans
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              We rebuilt the manga reading experience from the ground up. Fast, immersive, and social.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Lightning Speed",
                desc: "Images load instantly. Next chapters are intelligently pre-loaded in the background.",
                icon: Zap,
                textColor: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5 group-hover:bg-cyan-500/10",
              },
              {
                title: "Fluid Reading",
                desc: "Designed for seamless scrolling. Swipe through high-definition chapters with zero lag.",
                icon: BookOpen,
                textColor: "text-violet-400 border-violet-500/20 bg-violet-500/5 group-hover:bg-violet-500/10",
              },
              {
                title: "Gamified Reading",
                desc: "Earn XP, unlock rare achievements, climb streaks, and customize your profile badges.",
                icon: Trophy,
                textColor: "text-amber-400 border-amber-500/20 bg-amber-500/5 group-hover:bg-amber-500/10",
              },
              {
                title: "Instant Releases",
                desc: "Follow your favorite creators and get instant push notifications the second a chapter drops.",
                icon: Bell,
                textColor: "text-rose-400 border-rose-500/20 bg-rose-500/5 group-hover:bg-rose-500/10",
              },
            ].map((prop, i) => {
              const Icon = prop.icon;
              return (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-border/30 bg-card/25 p-6.5 transition-all hover:translate-y-[-4px] hover:border-primary/50 hover:bg-card/45 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div
                    className={`mb-4 grid h-12 w-12 place-items-center rounded-xl border transition-transform group-hover:scale-110 ${prop.textColor}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold mb-2 group-hover:text-primary transition-colors">{prop.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{prop.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Trust, Legal & Compliance Section ─── */}
      <section className="py-20 md:py-28 border-b border-border/20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent mb-3">
                <ShieldCheck className="h-4.5 w-4.5" /> Trust & Security
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
                A Legitimate, Law-Abiding Reading Community
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                vnrscans is committed to respecting legal boundaries and protecting user privacy. vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.
              </p>

              <div className="mt-8 space-y-4">
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
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary/30 border border-border/40 text-accent">
                        <ItemIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{item.title}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Trust Callout Block */}
            <div className="relative group max-w-md mx-auto lg:max-w-none">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary to-accent opacity-20 blur-lg transition duration-1000 group-hover:opacity-30 group-hover:duration-200" />
              <div className="relative rounded-2xl border border-border/40 bg-card p-8">
                <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/15 mb-4 text-3xs font-bold uppercase tracking-widest">
                  Safe Browsing Certified
                </Badge>
                <h3 className="text-xl font-bold">Creator-First Ecosystem</h3>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  We believe that the future of scanlation lies in legal partnership. If you are an artist, translator, or writer looking to publish your story, vnrscans provides the tools, traffic, and community to launch your career.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Link href="/about">
                    <Button variant="outline" className="h-10 px-5 text-xs font-bold rounded-xl border border-primary/25 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:shadow-[0_0_15px_rgba(174,103,250,0.2)] transition-all hover:translate-y-[-1px] cursor-pointer">
                      Our Policy Details
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button className="h-10 px-5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(174,103,250,0.3)] transition-all hover:translate-y-[-1px] cursor-pointer border-0 shadow-sm">
                      Submit Your Work
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Have questions about vnrscans? We have answers.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold hover:no-underline">
                Is vnrscans completely free to use?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Yes! vnrscans is entirely free for all readers. We do not require any paid subscription to read our indexed series or keep track of your reading progress.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold hover:no-underline">
                How does the leveling and XP system work?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                As you read chapters, interact with comments, and keep up your reading streaks, you earn experience points (XP). Accumulating XP increases your User Level, which unlocks rare badges, exclusive profile accent customizers, and high-tier community ranks.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold hover:no-underline">
                Where does vnrscans get its content?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold hover:no-underline">
                What is your DMCA copyright policy?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                We take intellectual property ownership extremely seriously. If you are a copyright holder and believe your work is on our platform without authorization, you can file a quick takedown notice on our DMCA page. We review and remove verified reports within 5 business days.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5" className="border-border/30">
              <AccordionTrigger className="text-sm font-bold hover:no-underline">
                Can independent creators publish their work here?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Absolutely! We love supporting independent authors and illustrators. Please reach out to hello@vnrscans.com or use our Contact page form to send us details of your work, and our admin team will assist you in setting up your series.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
