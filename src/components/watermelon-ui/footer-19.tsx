"use client";

import React, { type ReactNode } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@/lib/router-compat";

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterSocialLink {
  icon: ReactNode;
  href: string;
  label: string;
}

export interface Footer19Props {
  badgeText?: string;
  heading?: string;
  description?: string;
  brandName?: string;
  navColumns?: FooterColumn[];
  copyright?: string;
  socialLinks?: FooterSocialLink[];
}

const defaultNavColumns: FooterColumn[] = [
  {
    title: "EXPLORE",
    links: [
      { label: "Home Feed", href: "/home" },
      { label: "Comics Directory", href: "/browse" },
      { label: "Top Rankings", href: "/rankings" },
      { label: "Novels Hub", href: "/novels" },
    ],
  },
  {
    title: "COMMUNITY",
    links: [
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Recommendations", href: "/recommendations" },
      { label: "Request Series", href: "/request-series" },
      { label: "Data Map", href: "/data-map" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "DMCA Compliance", href: "/dmca" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "System Status", href: "/status" },
    ],
  },
];

const defaultSocialLinks: FooterSocialLink[] = [
  {
    label: "Discord",
    href: "https://discord.gg/",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    label: "Twitter / X",
    href: "https://x.com/",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
];

export default function Footer19({
  badgeText = "VNR SCANS OFFICIAL",
  heading = "A premium, lightning-fast scanlation reading platform designed for the community.",
  description = "Read thousands of manga, manhwa, manhua, and light novels in crisp high definition with instant chapter updates.",
  brandName = "VNR SCANS",
  navColumns = defaultNavColumns,
  copyright = "© 2026 VNR SCANS. All rights reserved.",
  socialLinks = defaultSocialLinks,
}: Footer19Props) {
  return (
    <footer className="border-t border-white/10 bg-[#06060a] text-neutral-300 py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          {/* Brand Intro & Action Buttons (newsletter removed) */}
          <div className="lg:col-span-6 flex flex-col items-center text-center sm:items-start sm:text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{badgeText}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white max-w-md leading-snug">
              {heading}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-transform hover:scale-105 shadow-sm"
              >
                <span>Browse Directory</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href="https://discord.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-transform hover:scale-105"
              >
                <span>Discord Server</span>
              </a>
            </div>
          </div>

          {/* Nav columns (centralized on mobile) */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 text-center sm:text-left">
            {navColumns.map((col, idx) => (
              <div key={idx} className="space-y-3 flex flex-col items-center sm:items-start">
                <p className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
                  {col.title}
                </p>
                <ul className="space-y-2 text-xs flex flex-col items-center sm:items-start">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        to={link.href}
                        className="hover:text-purple-300 transition-colors inline-flex items-center gap-1 group"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar with logo, copyright and socials */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 text-center sm:text-left">
          <div className="flex items-center gap-2.5 shrink-0">
            <img src="/favicon.svg" alt="vnr logo" width={24} height={24} className="h-6 w-6 rounded object-contain shrink-0" />
            <span className="font-black text-white text-sm tracking-wider uppercase whitespace-nowrap">{brandName}</span>
          </div>

          <p className="whitespace-nowrap">{copyright}</p>

          <div className="flex items-center gap-2">
            {socialLinks.map((item, i) => (
              <a
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="text-neutral-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
