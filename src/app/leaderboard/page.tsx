import type { Metadata } from "next";
import { LeaderboardClient } from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "Leaderboard Coming Soon — vnrscans",
  description:
    "Season 1 Heavenly Dao Ascension leaderboard is coming soon to vnrscans. Manga reading streaks, badges, and spiritual Qi rewards for daily readers.",
  keywords: [
    "manga reading streaks",
    "manga streak rewards",
    "manga reading badges",
    "gamified reading app",
    "manga leaderboard",
    "reading rewards",
    "which manga sites have rewards for reading daily",
    "how do reading streaks work on manga platforms",
    "gamified manga reading platforms",
  ],
  openGraph: {
    title: "Leaderboard Coming Soon — vnrscans",
    description: "Season 1 Heavenly Dao Ascension cultivation leaderboard is coming soon to vnrscans.",
    url: "https://www.vnrscans.com/leaderboard",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
