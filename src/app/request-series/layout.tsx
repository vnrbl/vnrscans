import type { Metadata } from "next";

/**
 * The request-series page is a client component (interactive form), so its
 * metadata lives here. Targets creator/publisher keyword intents:
 * "publish manga online", "submit manga to platform", "indie manga creator".
 */
export const metadata: Metadata = {
  title: "Request or Submit a Manga, Manhwa or Novel — vnrscans",
  description:
    "Missing a title? Request any manga, manhwa, manhua, or novel for the vnrscans library — or submit your own series. Independent manga creators welcome.",
  keywords: [
    "request manga",
    "submit manga to platform",
    "publish manga online",
    "indie manga creator",
    "submit manhwa",
    "suggest a manga series",
  ],
  alternates: {
    canonical: "/request-series",
  },
  openGraph: {
    title: "Request or Submit a Series — vnrscans",
    description:
      "Request any manga, manhwa, or novel for the vnrscans library — or publish your own. Independent creators welcome.",
    url: "https://www.vnrscans.com/request-series",
    type: "website",
  },
};

export default function RequestSeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
