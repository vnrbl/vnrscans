import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

import path from "node:path";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  outputFileTracingRoot: path.resolve(__dirname),
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "puppeteer", "@supabase/supabase-js", "@supabase/ssr"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
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
        hostname: "meo.comick.cc",
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
        hostname: "media.qimanga.com",
      },
      {
        protocol: "https",
        hostname: "media.qiscans.org",
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
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-context-menu",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "sonner",
      "cmdk",
      "zod",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/sitemap-series-:page.xml",
        destination: "/sitemap-series/:page",
      },
      {
        source: "/sitemap-chapters-:page.xml",
        destination: "/sitemap-chapters/:page",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.(ico|svg|png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default withAnalyzer(nextConfig);
