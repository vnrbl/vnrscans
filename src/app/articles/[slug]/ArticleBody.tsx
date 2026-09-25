import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { ARTICLES, type Article } from "@/lib/articles";

/** Server-rendered article body: sections, FAQ, CTA, related reading. */
export default function ArticleBody({ article }: { article: Article }) {
  const related = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 md:px-8">
      <nav aria-label="Breadcrumb" className="text-3xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-purple-300 transition-colors">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/articles" className="hover:text-purple-300 transition-colors">Articles</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{article.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {article.targets.map((t) => (
          <span
            key={t}
            className="rounded-full border border-purple-500/30 bg-purple-950/20 px-2 py-0.5 text-3xs font-mono uppercase tracking-wider text-purple-300"
          >
            {t}
          </span>
        ))}
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
        {article.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-light">
        {article.excerpt}
      </p>
      <div className="mt-4 flex items-center gap-4 text-3xs text-muted-foreground/70 font-mono uppercase tracking-wider">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {article.readingMinutes} min read
        </span>
        <span>Published {article.datePublished}</span>
        {article.dateModified && <span>· Updated {article.dateModified}</span>}
      </div>

      <article className="mt-10 space-y-10">
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-white mb-3">{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mb-3 text-sm leading-relaxed text-muted-foreground font-light">
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="my-4 space-y-2">
                {section.list.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground font-light">
                    <span className="shrink-0 text-purple-400">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>

      {article.faq && article.faq.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold text-white">Frequently asked questions</h2>
          <div className="space-y-3">
            {article.faq.map((item) => (
              <details key={item.question} className="group rounded-lg border border-border/60 bg-surface-1/40">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white">
                  {item.question}
                </summary>
                <p className="px-4 pb-3 text-sm leading-relaxed text-muted-foreground font-light">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 rounded-xl border border-purple-500/30 bg-purple-950/20 p-6">
        <h2 className="text-base font-bold text-white">Start reading on vnrscans</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-light">
          Every series type mentioned in this guide lives in the vnrscans catalog. Browse by
          genre or tag, bookmark your favorites, and keep your streak alive.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-purple-500"
          >
            Browse catalog <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/rankings"
            className="inline-flex items-center gap-2 rounded-md border border-purple-500/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-purple-300 transition-colors hover:bg-purple-950/40"
          >
            View rankings
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-white">Continue reading</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {related.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="group rounded-lg border border-border/60 bg-surface-1/40 p-4 transition-all hover:border-purple-500/50"
            >
              <h3 className="text-sm font-bold leading-snug text-white transition-colors group-hover:text-purple-300">
                {a.title}
              </h3>
              <p className="mt-1.5 text-3xs font-mono uppercase tracking-wider text-muted-foreground">
                {a.readingMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-purple-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All articles
        </Link>
      </div>
    </div>
  );
}
