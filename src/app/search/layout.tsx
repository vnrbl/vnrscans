import type { Metadata } from "next";

// Search results pages should not be indexed — they produce thin,
// near-duplicate URLs (?q=...) that dilute crawl quality.
export const metadata: Metadata = {
  title: "Search — vnrscans",
  robots: { index: false, follow: true },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
