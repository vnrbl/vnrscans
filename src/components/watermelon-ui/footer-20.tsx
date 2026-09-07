"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@/lib/router-compat";

export interface FooterSocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

export interface Footer20Props {
  brandName?: string;
  description?: string;
  email?: string;
  socialLinks?: FooterSocialLink[];
}

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

export default function Footer20({
  brandName = "VNR SCANS",
  description = "A premium, lightning-fast scanlation reading platform designed for the manga, manhwa, and manhua community.",
  email = "support@vnrscans.com",
  socialLinks = defaultSocialLinks,
}: Footer20Props) {
  return (
    <footer className="relative border-t border-white/10 bg-[#06060a] text-neutral-400 overflow-hidden pt-12 pb-6">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Brand & Description - Centralized on mobile */}
          <div className="md:col-span-6 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
            <Link to="/home" className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="vnr logo" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
              <span className="text-xl font-black text-white tracking-widest uppercase whitespace-nowrap">{brandName}</span>
            </Link>
            <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
              {description}
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              Inquiries: <a href={`mailto:${email}`} className="text-purple-400 hover:underline">{email}</a>
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-1">
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

          {/* Links columns - 2 grid in 1 row on mobile */}
          <div className="md:col-span-6 grid grid-cols-2 gap-6 sm:gap-8">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white">Directory</h4>
              <ul className="space-y-2 text-xs flex flex-col items-center sm:items-start">
                <li><Link to="/home" className="hover:text-white transition-colors">Home Page</Link></li>
                <li><Link to="/browse" className="hover:text-white transition-colors">Browse Manga</Link></li>
                <li><Link to="/rankings" className="hover:text-white transition-colors">Top Rankings</Link></li>
                <li><Link to="/novels" className="hover:text-white transition-colors">Light Novels</Link></li>
              </ul>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white">Policies</h4>
              <ul className="space-y-2 text-xs flex flex-col items-center sm:items-start">
                <li><Link to="/dmca" className="hover:text-white transition-colors">DMCA Notice</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security Center</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar - Centralized on mobile */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 text-center sm:text-left">
          <p className="whitespace-nowrap">© 2026 {brandName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
            <Link to="/dmca" className="hover:text-neutral-300">DMCA</Link>
            <Link to="/privacy" className="hover:text-neutral-300">Privacy</Link>
            <Link to="/terms" className="hover:text-neutral-300">Terms</Link>
          </div>
        </div>

        {/* Large watermark typography */}
        <div className="select-none pointer-events-none mt-6 text-center">
          <span className="text-[12vw] font-black tracking-tighter leading-none text-white/[0.03] uppercase">
            {brandName}
          </span>
        </div>
      </div>
    </footer>
  );
}