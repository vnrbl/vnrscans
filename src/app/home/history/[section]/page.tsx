import type { Metadata } from "next";
import { Suspense } from "react";
import HomeHistoryContent from "./HomeHistoryContent";

type PageProps = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ period?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  return {
    title: `${section} History — vnrscans`,
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { section } = await params;
  const { period } = await searchParams;
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <HomeHistoryContent section={section} period={period} />
    </Suspense>
  );
}
