import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Providers } from "@/components/Providers";
import "@/styles.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-barlow",
  adjustFontFallback: true,
  preload: true,
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-barlow-condensed",
  adjustFontFallback: true,
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vnrscans.com"),
  title: "vnrscans - Read Manga, Manhwa, Manhua & Novels",
  description: "Discover manhwa stories drawn by imagination. Fast, free, and premium reading experience.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "vnrscans",
    description: "Read manga, manhwa, manhua, and novels on vnrscans.",
    type: "website",
    url: "https://www.vnrscans.com",
  },
  twitter: {
    card: "summary",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${barlow.variable} ${barlowCondensed.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
