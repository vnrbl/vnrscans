import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Ranked Manga, Manhwa & Manhua — vnrscans",
  description:
    "Explore the top-rated, trending, most-viewed, and most-followed manga, manhwa, and manhua series on vnrscans.",
  alternates: {
    canonical: "https://www.vnrscans.com/rankings",
  },
  openGraph: {
    title: "Top Ranked Manga, Manhwa & Manhua — vnrscans",
    description:
      "Explore the top-rated, trending, most-viewed, and most-followed manga, manhwa, and manhua series on vnrscans.",
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
