import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "puppeteer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "meo.comick.pictures",
      },
      {
        protocol: "https",
        hostname: "roliascan.com",
      },
      {
        protocol: "https",
        hostname: "cdn.asurascans.com",
      },
      {
        protocol: "https",
        hostname: "media.qimanhwa.com",
      },
      {
        protocol: "https",
        hostname: "en-thunderscans.com",
      },
      {
        protocol: "https",
        hostname: "storage.hivetoon.com",
      },
      {
        protocol: "https",
        hostname: "storage.vortexscans.org",
      },
      {
        protocol: "https",
        hostname: "elftoon.com",
      },
      {
        protocol: "https",
        hostname: "cdn.qiscans.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      "",
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-icons",
      "recharts",
    ],
  },
};

export default withAnalyzer(nextConfig);
