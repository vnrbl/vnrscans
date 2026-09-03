import type { Metadata } from "next";
import { LeaderboardClient } from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "Leaderboard Coming Soon — vnrscans",
  description:
    "Season 1 Heavenly Dao Ascension leaderboard is coming soon to vnrscans. Prepare your reading streaks and spiritual Qi.",
  openGraph: {
    title: "Leaderboard Coming Soon — vnrscans",
    description: "Season 1 Heavenly Dao Ascension cultivation leaderboard is coming soon to vnrscans.",
    url: "https://www.vnrscans.com/leaderboard",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
