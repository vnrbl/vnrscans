import type { Metadata } from "next";
import { LeaderboardClient } from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "User Leaderboard & Season Ranks — vnrscans",
  description:
    "Real-time rankings of top manga and manhwa readers, cultivation levels, reading streaks, and seasonal rank tier rewards on vnrscans.",
  openGraph: {
    title: "User Leaderboard & Season Ranks — vnrscans",
    description: "Compete on the global reader leaderboard, climb rank tiers, and claim exclusive seasonal rewards.",
    url: "https://www.vnrscans.com/leaderboard",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
