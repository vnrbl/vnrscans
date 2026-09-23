import type { Metadata, Viewport } from "next";
import {
  Inter,
  Barlow_Condensed,
  Lora,
  Roboto,
  JetBrains_Mono,
} from "next/font/google";
import { Providers } from "@/components/Providers";
import "@/styles.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Condensed industrial display face for page/section titles (genre standard)
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-barlow-condensed",
});

// Novel reader faces (previously render-blocking CSS @imports)
const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
});

const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
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
  // Google Search Console verification. Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  // (e.g. "abc123def456") in env to enable the <meta> tag. No-op until then.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${barlowCondensed.variable} ${lora.variable} ${roboto.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* iOS: enable standalone PWA mode and extend content behind notch */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://edvqhmvqbtujzcfqkrbe.supabase.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://edvqhmvqbtujzcfqkrbe.supabase.co" />
        <link rel="preconnect" href="https://media.qimanga.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://media.qimanga.com" />
        <link rel="preconnect" href="https://media.qiscans.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://media.qiscans.org" />
        <link rel="preconnect" href="https://cdn.asurascans.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.asurascans.com" />
        <link rel="preconnect" href="https://witchtoons.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://witchtoons.net" />
        <link rel="preconnect" href="https://cdn.duskscans.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.duskscans.com" />
        <link rel="preconnect" href="https://elftoon.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://elftoon.com" />
        <link rel="dns-prefetch" href="https://meo.comick.pictures" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
