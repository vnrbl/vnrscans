import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, Tag, Share2, Sparkles, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NEWS_POSTS } from "@/lib/data/newsPosts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = NEWS_POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: `${post.title} — vnrscans Editorial`,
    description: post.excerpt,
    keywords: post.tags,
    alternates: {
      canonical: `/news/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://www.vnrscans.com/news/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export async function generateStaticParams() {
  return NEWS_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = NEWS_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = NEWS_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  // Structured Data JSON-LD for Google AdSense & SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "vnrscans",
      logo: {
        "@type": "ImageObject",
        url: "https://www.vnrscans.com/favicon.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.vnrscans.com/news/${post.slug}`,
    },
  };

  return (
    <article className="min-h-screen bg-background py-10 md:py-16 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background Glow */}
      <div className="absolute top-[-5%] left-1/3 h-[450px] w-[450px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8 relative z-10">
        {/* Back Link */}
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Articles & News
        </Link>

        {/* Header Metadata */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-semibold">
              {post.category}
            </Badge>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-border/60">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl leading-tight text-foreground">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border/60">
                <Image src={post.author.avatar} alt={post.author.name} fill unoptimized className="object-cover" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">{post.author.name}</p>
                <p className="text-[11px] text-muted-foreground">{post.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {post.publishedAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {post.readTime}
              </span>
            </div>
          </div>
        </div>

        {/* Main Cover Image */}
        <div className="relative h-72 sm:h-96 md:h-[450px] w-full rounded-2xl overflow-hidden border border-border/60 mb-10 shadow-2xl">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            unoptimized
            className="object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div 
          className="article-body max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author Bio Card */}
        <div className="mt-14 p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm flex items-start gap-4 shadow-xl">
          <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-primary/40 shrink-0">
            <Image src={post.author.avatar} alt={post.author.name} fill unoptimized className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{post.author.name}</h4>
              <Badge variant="secondary" className="bg-primary/15 text-primary text-[10px] uppercase font-bold px-2 py-0.2">Official Founder</Badge>
            </div>
            <p className="text-xs text-primary font-medium mb-1.5">{post.author.role}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Founder and Chief Editor of VNR Scans. Dedicated to delivering ultra-fast chapter scanlations, in-depth webtoon breakdowns, and global comic industry insights.
            </p>
          </div>
        </div>

        {/* Related Posts Section */}
        <div className="mt-16 pt-10 border-t border-border/40">
          <h3 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> More From Editorial
          </h3>

          <div className="grid gap-6 sm:grid-cols-3">
            {relatedPosts.map((rel) => (
              <Link key={rel.id} href={`/news/${rel.slug}`} className="group block">
                <Card className="overflow-hidden border-border/60 bg-card/60 transition-all hover:border-primary/50 hover:shadow-lg h-full flex flex-col justify-between">
                  <div>
                    <div className="relative h-36 w-full overflow-hidden">
                      <Image src={rel.coverImage} alt={rel.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{rel.category}</span>
                      <h4 className="font-bold text-xs line-clamp-2 mt-1 group-hover:text-primary transition-colors leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
