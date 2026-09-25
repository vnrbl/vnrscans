import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Ranked Manga, Manhwa & Manhua — vnrscans",
  description:
    "Explore the top-rated, trending, most-viewed, and most-followed manga, manhwa, and manhua series on vnrscans. Weekly manga series rankings, from top rated manga to the most popular manhwa.",
  keywords: [
    "top rated manga",
    "manga series ranking",
    "most popular manhwa",
    "trending manhwa series",
    "best manhwa 2026",
    "popular manhwa 2026",
    "best action manhwa 2026",
    "new manhwa releases 2026",
    "manga ranking chart",
  ],
  alternates: {
    canonical: "https://www.vnrscans.com/rankings",
  },
  openGraph: {
    title: "Top Ranked Manga, Manhwa & Manhua — vnrscans",
    description:
      "Weekly manga series rankings: top-rated, trending, most-viewed, and most-followed manga, manhwa, and manhua on vnrscans.",
    type: "website",
    url: "https://www.vnrscans.com/rankings",
  },
};

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
