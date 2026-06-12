import type { Metadata } from "next";
import TagDetailPageContent from "./TagDetailPageContent";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} — Browse Tags — vnrscans`,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <TagDetailPageContent slug={slug} />;
}
