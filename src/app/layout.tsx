import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "@/styles.css";


export const metadata: Metadata = {
  title: "vnrscans — Read Manga, Manhwa, Manhua & Novels",
  description: "Discover manhwa stories drawn by imagination. Fast, free, and premium reading experience.",
  openGraph: {
    title: "vnrscans",
    description: "Read manga, manhwa, manhua, and novels on vnrscans.",
    type: "website",
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
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ]
  }
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Font preconnects — SpaceX design system (Barlow Condensed as D-DIN substitute) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.fontshare.com" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
