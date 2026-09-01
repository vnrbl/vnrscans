import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Home, Search, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found — vnrscans",
  description:
    "The page you were looking for could not be found. Browse manga, manhwa, and manhua on vnrscans.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-24 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <div className="container max-w-lg text-center relative">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border/40 bg-card/40 mx-auto mb-6 text-muted-foreground">
          <BookOpen className="h-8 w-8" />
        </div>

        <div className="eyebrow mb-3 tracking-[0.15em] text-primary">
          404 Error
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
          Page Not Found
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          The page or series you were looking for doesn&apos;t exist or may have
          been removed. It might have moved, or the link may be broken.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/home">
            <span className="btn-solid-pill cursor-pointer w-full sm:w-auto justify-center">
              <Home className="mr-1.5 h-4 w-4" /> Go Home
            </span>
          </Link>
          <Link href="/browse">
            <span className="btn-ghost-pill cursor-pointer w-full sm:w-auto justify-center">
              <Search className="mr-1.5 h-4 w-4" /> Browse Library{" "}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
