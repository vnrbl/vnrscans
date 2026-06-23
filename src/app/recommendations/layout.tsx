import type { Metadata } from "next";

// Personalized recommendation pages should not be indexed —
// they are auth-gated, dynamic per-user, and produce thin content for crawlers.
export const metadata: Metadata = {
  title: "Recommendations — vnrscans",
  description: "Personalized series recommendations based on your reading history.",
  robots: { index: false, follow: true },
};

export default function RecommendationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
