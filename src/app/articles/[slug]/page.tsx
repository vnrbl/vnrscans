import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, getArticle } from "@/lib/articles";
import {
  buildArticleLd,
  buildArticlesBreadcrumbLd,
  buildFaqLd,
} from "@/lib/article-schema";
import ArticleBody from "./ArticleBody";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article Not Found — vnrscans" };

  return {
    title: article.seoTitle,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.seoTitle,
      description: article.description,
      url: `https://www.vnrscans.com/articles/${article.slug}`,
      type: "article",
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.description,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const articleLd = buildArticleLd(article);
  const breadcrumbLd = buildArticlesBreadcrumbLd(article.title, article.slug);
  const faqLd = article.faq ? buildFaqLd(article.faq) : null;

  return (
    <div className="min-h-screen bg-background py-16 md:py-24 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

      <ArticleBody article={article} />
    </div>
  );
}
