"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { Link } from "@/lib/router-compat";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export interface Footer16Link {
  label: string;
  href: string;
}

export interface Footer16Column {
  title: string;
  links: Footer16Link[];
}

export interface Footer16Props {
  brandName?: string;
  tagline?: string;
  columns?: Footer16Column[];
  legalLinks?: Footer16Link[];
  copyright?: string;
}

const defaultColumns: Footer16Column[] = [
  {
    title: "Explore",
    links: [
      { label: "Home Page", href: "/home" },
      { label: "Browse Comics", href: "/browse" },
      { label: "Top Rankings", href: "/rankings" },
      { label: "Light Novels", href: "/novels" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Recommendations", href: "/recommendations" },
      { label: "Request Series", href: "/request-series" },
      { label: "Data Map", href: "/data-map" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "DMCA Policy", href: "/dmca" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "System Status", href: "/status" },
    ],
  },
];

const defaultLegalLinks: Footer16Link[] = [
  { label: "DMCA Notice", href: "/dmca" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Security", href: "/security" },
];

export default function Footer16({
  brandName = "VNR SCANS",
  tagline = "A premium, lightning-fast scanlation reading platform designed for the community.",
  columns = defaultColumns,
  legalLinks = defaultLegalLinks,
  copyright = "© 2026 VNR SCANS. All rights reserved.",
}: Footer16Props) {
  return (
    <footer className="relative border-t border-white/10 bg-[#06060a] text-neutral-400 overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/home" className="flex items-center gap-2.5 transition-transform hover:scale-105 w-fit">
              <img src="/favicon.svg" alt="vnrscans logo" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
              <span className="text-base font-black tracking-wider text-white uppercase">
                {brandName}
              </span>
            </Link>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
              {tagline}
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-1 text-emerald-400 text-[11px] font-bold tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" /> Official Scanlation Engine
            </div>
          </div>

          {/* Links Grid */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {columns.map((col, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white">
                  {col.title}
                </h4>
                <ul className="space-y-2 text-xs">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        to={link.href}
                        className="hover:text-purple-300 transition-colors inline-flex items-center gap-1 group"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all text-purple-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>{copyright}</p>
          <div className="flex flex-wrap items-center gap-4">
            {legalLinks.map((item, i) => (
              <Link key={i} to={item.href} className="hover:text-neutral-300 transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
