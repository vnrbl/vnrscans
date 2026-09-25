import type { Metadata } from "next";
import Link from "next/link";
import { Info, ShieldCheck, Users, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Us — vnrscans - Ultimate Manga Reader",
  description: "Learn more about vnrscans, a premium, community-driven manhwa and manga reader built for speed, safety, and creator respect.",
  keywords: [
    "about vnrscans",
    "manga reader platform",
    "read manga online free",
    "online manga platform",
    "manga reader experience",
    "free manga sites",
    "manhwa reader",
    "vnrscans review",
    "is vnrscans a good site to read manhwa",
    "vnrscans vs other manga readers",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us — vnrscans - Ultimate Manga Reader",
    description: "Learn more about vnrscans, a premium, community-driven manhwa and manga reader built for speed, safety, and creator respect.",
    url: "https://www.vnrscans.com/about",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Us — vnrscans - Ultimate Manga Reader",
    description: "Learn more about vnrscans, a premium, community-driven manhwa and manga reader built for speed, safety, and creator respect.",
  }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4.5 w-4.5" /> Back to landing
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-4 text-xs font-semibold text-primary">
            <Info className="h-4 w-4" /> About the Platform
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Crafting the Ultimate
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Manga Reading Experience
            </span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            vnrscans is a fast, clean, and modern reader built by manga lovers, for manga lovers. We focus on lightweight rendering, social community features, and strict compliance with creator copyright.
          </p>
        </div>

        {/* Grid Content */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="p-6 border-border/40 bg-card/40 backdrop-blur-sm space-y-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Community Driven</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We offer integrated social profiles, level customizers, Spiritual Qi progression, and interactive discussion systems so readers can discover stories together.
            </p>
          </Card>

          <Card className="p-6 border-border/40 bg-card/40 backdrop-blur-sm space-y-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Safe & Compliant</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We respect creators. vnrscans does not store any files on its servers and only links to media hosted on third-party services.
            </p>
          </Card>
        </div>

        {/* Story Section */}
        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-bold text-foreground">Our Core Beliefs</h2>
          <p>
            Traditional reading platforms are often cluttered with intrusive redirection links, tracking pixels, and malicious advertisements. We believe reading stories should be an immersive and safe escape. That is why vnrscans features a completely clean reader view with optimized asset preloading.
          </p>

          <h2 className="text-xl font-bold text-foreground mt-8">Rights & Licensing</h2>
          <p>
            vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.
          </p>

          <p>
            If you are a rights holder and have found copyright concerns, please file a quick inquiry on our dedicated <Link href="/dmca" className="text-primary hover:underline font-semibold">DMCA Copyright page</Link>. We pride ourselves on rapid verification and link removal.
          </p>
        </div>

        {/* CTA Banner */}
        <div className="relative mt-16 rounded-2xl border border-primary/20 bg-gradient-to-r from-violet-950/20 via-purple-950/10 to-transparent p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-foreground">Are you a Content Creator?</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Publish your original manga, manhwa, or web novels on vnrscans and connect with thousands of active daily readers.
            </p>
          </div>
          <Link href="/contact">
            <Button className="font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-11 px-6 shadow-md hover:translate-y-[-1px] transition-transform">
              Join as Partner <Star className="ml-1.5 h-3.5 w-3.5 fill-current" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
