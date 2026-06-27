import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Newspaper, Clock, ArrowRight, Sparkles, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NEWS_POSTS } from "@/lib/data/newsPosts";

export const metadata: Metadata = {
  title: "Manga & Webtoon News, Editorial Reviews & Guides — vnrscans",
  description: "Explore in-depth articles, expert reviews, cultivation guides, and industry analysis on modern Manga, Manhwa, and Manhua.",
  keywords: ["manga news", "webtoon reviews", "manhwa guide", "cultivation manhua", "vnrscans editorial", "anime manga analysis"],
  alternates: {
    canonical: "/news",
  },
  openGraph: {
    title: "Manga & Webtoon News, Editorial Reviews & Guides — vnrscans",
    description: "Explore in-depth articles, expert reviews, cultivation guides, and industry analysis on modern Manga, Manhwa, and Manhua.",
    url: "https://www.vnrscans.com/news",
    type: "website",
  },
};

export default function NewsPage() {
  const featuredPost = NEWS_POSTS[0];
  const recentPosts = NEWS_POSTS.slice(1);

  return (
    <div className="min-h-screen bg-background py-10 md:py-16 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
        {/* Page Header */}
        <div className="mb-12 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
            <Newspaper className="h-3.5 w-3.5" /> Editorial & Industry Insights
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl lg:leading-tight">
            Manga & Webtoon Articles
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Discover comprehensive reviews, industry breakdowns, genre tutorials, and expert analysis covering the latest trends in Japanese Manga, Korean Manhwa, and Chinese Manhua.
          </p>
        </div>

        {/* Featured Post (Hero Section) */}
        <div className="mb-14">
          <Link href={`/news/${featuredPost.slug}`} className="group block">
            <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-2xl">
              <div className="grid md:grid-cols-12 gap-0 items-center">
                <div className="md:col-span-7 relative h-64 sm:h-80 md:h-[420px] overflow-hidden">
                  <Image
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent md:hidden" />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground font-semibold">
                    Featured Story
                  </Badge>
                </div>

                <div className="md:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 font-medium">
                      <span className="text-primary font-bold uppercase tracking-wider">{featuredPost.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featuredPost.readTime}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight group-hover:text-primary transition-colors leading-snug">
                      {featuredPost.title}
                    </h2>

                    <p className="mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 rounded-full overflow-hidden border border-border/60">
                        <Image src={featuredPost.author.avatar} alt={featuredPost.author.name} fill unoptimized className="object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{featuredPost.author.name}</p>
                        <p className="text-[10px] text-muted-foreground">{featuredPost.publishedAt}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                      Read Full <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Articles Grid */}
        <div>
          <h3 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Recent Articles & Guides
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/news/${post.slug}`} className="group flex">
                <Card className="flex flex-col justify-between overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 w-full">
                  <div>
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge variant="secondary" className="absolute top-3 left-3 bg-background/80 backdrop-blur text-[10px] font-semibold">
                        {post.category}
                      </Badge>
                    </div>

                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime}</span>
                        <span>•</span>
                        <span>{post.publishedAt}</span>
                      </div>

                      <h4 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>

                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </CardContent>
                  </div>

                  <div className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-border/30 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-6 w-6 rounded-full overflow-hidden border border-border/60">
                        <Image src={post.author.avatar} alt={post.author.name} fill unoptimized className="object-cover" />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">{post.author.name}</span>
                    </div>
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
