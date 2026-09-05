import type { Metadata } from "next";
import { Suspense } from "react";
import HomeHistoryContent from "@/app/home/history/[section]/HomeHistoryContent";

export const metadata: Metadata = {
  title: "New Chapters from Followed — vnrscans",
  description: "Latest chapter releases and updates from your followed and favorited series.",
};

type PageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function FollowedPage({ searchParams }: PageProps) {
  const { period } = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <HomeHistoryContent section="followed-chapters" period={period} />
    </Suspense>
  );
}
