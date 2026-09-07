"use client";

import React from "react";
import { ArrowUpRight, Sparkles, Globe, Send } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { Link } from "@/lib/router-compat";

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface Footer19Props {
  badgeText?: string;
  newsletterHeading?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  brandName?: string;
  navColumns?: FooterColumn[];
  copyright?: string;
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
      { label: "Reader Leaderboard", href: "/leaderboard" },
      { label: "Recommendations", href: "/recommendations" },
      { label: "Request Series", href: "/request-series" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "DMCA Compliance", href: "/dmca" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export default function Footer19({
  badgeText = "VNR SCANS OFFICIAL",
  newsletterHeading = "Never miss a chapter release. Get notifications & updates weekly.",
  newsletterPlaceholder = "Enter your email",
  newsletterButtonText = "Subscribe",
  brandName = "VNR SCANS",
  navColumns = defaultNavColumns,
  copyright = "© 2026 VNR SCANS. All rights reserved.",
}: Footer19Props) {
  return (
    <footer className="border-t border-white/10 bg-[#06060a] text-neutral-300 py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          {/* Newsletter section */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{badgeText}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white max-w-md leading-snug">
              {newsletterHeading}
            </h3>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 max-w-md pt-2">
              <input
                type="email"
                placeholder={newsletterPlaceholder}
                className="bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-500 flex-1 outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>{newsletterButtonText}</span>
                <Send className="h-3 w-3" />
              </button>
            </form>
          </div>

          {/* Nav columns */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {navColumns.map((col, idx) => (
              <div key={idx} className="space-y-3">
                <p className="text-[11px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                  {col.title}
                </p>
                <ul className="space-y-2 text-xs">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        to={link.href}
                        className="hover:text-purple-400 transition-colors inline-flex items-center gap-1 group"
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

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="vnr logo" width={24} height={24} className="h-6 w-6 rounded object-contain" />
            <span className="font-bold text-white tracking-wider">{brandName}</span>
          </div>
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
