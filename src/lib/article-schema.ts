import { articleUrl } from "@/lib/articles";

/**
 * JSON-LD builders for article pages. Kept separate so the page file stays
 * small and the schema shapes are unit-testable.
 */

const SITE = "https://www.vnrscans.com";

export function buildArticleLd(article: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  keywords: string[];
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    author: { "@type": "Organization", name: "vnrscans", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "vnrscans",
      logo: { "@type": "ImageObject", url: `${SITE}/favicon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl(article.slug) },
    keywords: article.keywords.join(", "),
    inLanguage: "en",
  };
}

export function buildArticlesBreadcrumbLd(articleTitle: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE}/articles` },
      { "@type": "ListItem", position: 3, name: articleTitle, item: articleUrl(slug) },
    ],
  };
}

export function buildArticlesIndexBreadcrumbLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE}/articles` },
    ],
  };
}

export function buildFaqLd(faq: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
