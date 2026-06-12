import type { Metadata } from "next";
import ChapterReaderContent from "./ChapterReaderContent";

type PageProps = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { chapterSlug } = await params;
  return {
    title: `Read ${chapterSlug} — vnrscans`,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug, chapterSlug } = await params;
  return <ChapterReaderContent slug={slug} chapterSlug={chapterSlug} />;
}
