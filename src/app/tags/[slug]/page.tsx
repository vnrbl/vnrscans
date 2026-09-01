import type { Metadata } from "next";
import TagDetailPageContent from "./TagDetailPageContent";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tagName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `Browse ${tagName} Manga, Manhwa, & Manhua — vnrscans`;
  const description = `Discover and read the best manga, manhwa, manhua, and novels tagged with ${tagName} on vnrscans. Fast, high-quality reading experience.`;
  return {
    title,
    description,
    keywords: [tagName, `${tagName} manga`, `${tagName} manhwa`, `${tagName} manhua`, "read online", "vnrscans"],
    alternates: {
      canonical: `/tags/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.vnrscans.com/tags/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    }
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <TagDetailPageContent slug={slug} />;
}
