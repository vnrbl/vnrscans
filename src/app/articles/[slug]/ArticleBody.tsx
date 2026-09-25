import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Info,
  Star,
  BookOpen,
  Compass,
} from "lucide-react";
import { ARTICLES, type Article } from "@/lib/articles";

export default function ArticleBody({ article }: { article: Article }) {
  const related = ARTICLES.filter((a) => a.slug !== article.slug)
    .filter((a) => a.category === article.category || !article.category)
    .slice(0, 3);

  // If not enough in same category, pad with other articles
  const finalRelated =
    related.length === 3
      ? related
      : [
          ...related,
          ...ARTICLES.filter(
            (a) => a.slug !== article.slug && !related.some((r) => r.slug === a.slug)
          ),
        ].slice(0, 3);

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-3xs text-muted-foreground mb-6 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="hover:text-purple-300 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/articles" className="hover:text-purple-300 transition-colors">
          Articles
        </Link>
        <span>/</span>
        <span className="text-purple-400/90 font-medium">{article.category}</span>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
      </nav>

      {/* Tags & Category */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="rounded-md border border-purple-500/40 bg-purple-900/30 px-2.5 py-1 text-3xs font-semibold uppercase tracking-wider text-purple-200">
          {article.category}
        </span>
        {article.tags.map((t) => (
          <span
            key={t}
            className="rounded-md border border-border/80 bg-surface-1/60 px-2 py-0.5 text-3xs font-medium text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Main Title & Excerpt */}
      <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl leading-tight">
        {article.title}
      </h1>
      <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground/90 font-normal">
        {article.excerpt}
      </p>

      {/* Metadata Bar */}
      <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-border/50 py-3 text-xs text-muted-foreground/70 font-mono">
        <span className="inline-flex items-center gap-1.5 text-foreground/80">
          <Clock className="h-3.5 w-3.5 text-purple-400" /> {article.readingMinutes} min read
        </span>
        <span>Published {article.datePublished}</span>
        {article.dateModified && <span>· Updated {article.dateModified}</span>}
      </div>

      {/* Key Takeaways Box (Brief & Comfortable to read) */}
      {article.takeaways && article.takeaways.length > 0 && (
        <div className="mt-8 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-surface-1/60 to-surface-2/40 p-5 sm:p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Key Takeaways at a Glance
            </h2>
          </div>
          <ul className="space-y-2.5">
            {article.takeaways.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Article Body Sections */}
      <article className="mt-12 space-y-12">
        {article.sections.map((section) => (
          <section key={section.heading} className="scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4 tracking-tight flex items-center gap-3">
              <span className="h-5 w-1 rounded-full bg-purple-500" />
              {section.heading}
            </h2>

            {section.paragraphs.map((p, i) => (
              <p
                key={i}
                className="mb-4 text-sm sm:text-base leading-relaxed text-muted-foreground/90 font-light"
              >
                {p}
              </p>
            ))}

            {/* List */}
            {section.list && (
              <ul className="my-5 space-y-2.5 rounded-xl border border-border/40 bg-surface-1/30 p-4 sm:p-5">
                {section.list.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-sm sm:text-base leading-relaxed text-muted-foreground/90 font-light"
                  >
                    <span className="shrink-0 text-purple-400 font-bold">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Callout Box */}
            {section.callout && (
              <div
                className={`my-6 rounded-xl border p-4 sm:p-5 ${
                  section.callout.type === "tip"
                    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
                    : section.callout.type === "highlight"
                    ? "border-purple-500/40 bg-purple-950/25 text-purple-200"
                    : "border-blue-500/30 bg-blue-950/20 text-blue-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-bold text-xs uppercase tracking-wider text-white">
                  {section.callout.type === "tip" ? (
                    <Lightbulb className="h-4 w-4 text-emerald-400" />
                  ) : section.callout.type === "highlight" ? (
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-400" />
                  )}
                  <span>{section.callout.title || "Note"}</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground font-light">
                  {section.callout.text}
                </p>
              </div>
            )}

            {/* Detailed Series Recommendation Cards */}
            {section.seriesList && section.seriesList.length > 0 && (
              <div className="mt-8 space-y-6">
                {section.seriesList.map((series, idx) => (
                  <div
                    key={series.slug}
                    className="group rounded-2xl border border-border/70 bg-surface-1/40 hover:border-purple-500/40 hover:bg-surface-1/70 transition-all p-4 sm:p-6 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Series Cover Image */}
                      <Link
                        href={`/title/${series.slug}`}
                        className="relative shrink-0 w-full sm:w-36 md:w-44 aspect-[2/3] rounded-xl overflow-hidden border border-border/80 shadow-md group-hover:shadow-purple-500/10 transition-shadow bg-surface-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={series.coverUrl}
                          alt={series.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2 left-2 flex items-center justify-center h-6 w-6 rounded-full bg-black/70 backdrop-blur-md text-3xs font-mono font-bold text-white border border-white/10">
                          #{idx + 1}
                        </div>
                      </Link>

                      {/* Series Content & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <Link
                            href={`/title/${series.slug}`}
                            className="text-lg sm:text-xl font-black text-white hover:text-purple-300 transition-colors tracking-tight"
                          >
                            {series.title}
                          </Link>
                          {series.rating && (
                            <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span>{series.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Status and Genres */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {series.status && (
                            <span className="rounded-md bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 text-3xs font-semibold text-emerald-300 uppercase">
                              {series.status}
                            </span>
                          )}
                          {series.genres.map((g) => (
                            <span
                              key={g}
                              className="rounded-md bg-surface-2/80 border border-border/60 px-2 py-0.5 text-3xs font-medium text-muted-foreground"
                            >
                              {g}
                            </span>
                          ))}
                        </div>

                        {/* Plot Synopsis */}
                        <div className="mb-3.5">
                          <p className="text-3xs uppercase tracking-wider font-bold text-purple-300/90 mb-1 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> Plot Synopsis
                          </p>
                          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground font-light line-clamp-4">
                            {series.plot}
                          </p>
                        </div>

                        {/* Why You Should Read It */}
                        <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 mb-4">
                          <p className="text-3xs uppercase tracking-wider font-bold text-purple-300 mb-1 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-400" /> Why It&apos;s Worth Reading
                          </p>
                          <p className="text-xs sm:text-sm text-foreground/90 font-light leading-relaxed">
                            {series.whyRead}
                          </p>
                        </div>

                        {/* Direct Read CTA */}
                        <div>
                          <Link
                            href={`/title/${series.slug}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white uppercase tracking-wider transition-colors shadow-md shadow-purple-900/30"
                          >
                            Read on vnrscans <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </article>

      {/* Frequently Asked Questions */}
      {article.faq && article.faq.length > 0 && (
        <section className="mt-16 pt-8 border-t border-border/60">
          <h2 className="mb-6 text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-purple-400" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {article.faq.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-border/60 bg-surface-1/40 transition-colors hover:border-purple-500/30"
              >
                <summary className="cursor-pointer list-none px-5 py-4 text-sm sm:text-base font-semibold text-white flex items-center justify-between">
                  <span>{item.question}</span>
                  <span className="text-purple-400 transition-transform group-open:rotate-90">›</span>
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground font-light border-t border-border/30 pt-3">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Start Reading CTA */}
      <section className="mt-14 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 to-surface-1/80 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] h-48 w-48 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <h2 className="text-lg sm:text-xl font-bold text-white">Start Reading Free on vnrscans</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-light max-w-xl">
          Every manhwa, manga, and novel featured in this guide is indexed in the vnrscans library.
          Filter by genre, bookmark your favorites, and begin cultivating Qi today.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-purple-500 shadow-md shadow-purple-900/30"
          >
            Browse All Series <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/rankings"
            className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-surface-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-purple-300 transition-colors hover:bg-purple-950/40"
          >
            View Top Rankings
          </Link>
        </div>
      </section>

      {/* Related Articles */}
      <section className="mt-14">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Continue Reading
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {finalRelated.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="group rounded-xl border border-border/60 bg-surface-1/40 p-4 transition-all hover:border-purple-500/50 hover:bg-surface-1/70"
            >
              <span className="text-3xs font-semibold uppercase tracking-wider text-purple-300 block mb-1">
                {a.category}
              </span>
              <h3 className="text-sm font-bold leading-snug text-white transition-colors group-hover:text-purple-300 line-clamp-2">
                {a.title}
              </h3>
              <p className="mt-2 text-3xs font-mono uppercase tracking-wider text-muted-foreground/80">
                {a.readingMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Back to all articles link */}
      <div className="mt-12 pb-8">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-purple-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all articles
        </Link>
      </div>
    </div>
  );
}
