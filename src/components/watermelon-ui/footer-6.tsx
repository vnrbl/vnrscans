"use client";

import { type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";

export interface Footer6Link {
  label: string;
  href: string;
}

export interface Footer6LinkGroup {
  title: string;
  links: Footer6Link[];
}

export interface Footer6SocialLink {
  icon: ReactNode;
  href: string;
  label: string;
}

export interface Footer6Props {
  logo?: ReactNode;
  brandName?: string;
  tagLine?: string;
  headline?: string;
  description?: string;
  statusText?: string;
  statusTag?: string;
  brandSubtitle?: string;
  copyright?: string;
  linkGroups?: Footer6LinkGroup[];
  legalLinks?: Footer6Link[];
  socialLinks?: Footer6SocialLink[];
}

export const GridTick = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`pointer-events-none absolute flex size-4 items-center justify-center ${className}`}>
      <div className="absolute h-px w-full bg-white/25" />
      <div className="absolute h-full w-px bg-white/25" />
    </div>
  );
};

export const GridRect = ({ className = " " }: { className?: string }) => {
  return (
    <div className={`pointer-events-none absolute flex size-1 items-center justify-center ${className}`}>
      <div className="size-full rounded-none bg-white/25" />
    </div>
  );
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const techReveal: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const defaultVnrLinkGroups: Footer6LinkGroup[] = [
  {
    title: "Browse",
    links: [
      { label: "Home Feed", href: "/home" },
      { label: "Browse Comics", href: "/browse" },
      { label: "Manga Releases", href: "/browse?type=manga" },
      { label: "Manhwa Series", href: "/browse?type=manhwa" },
      { label: "Light Novels", href: "/novels" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Top Rankings", href: "/rankings" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Recommendations", href: "/recommendations" },
      { label: "Request Series", href: "/request-series" },
      { label: "Data Map", href: "/data-map" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Library", href: "/library" },
      { label: "User Profile", href: "/profile" },
      { label: "Display Settings", href: "/settings" },
      { label: "Security SOC", href: "/security" },
      { label: "System Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "About Platform", href: "/about" },
      { label: "DMCA Notice", href: "/dmca" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Contact Inquiries", href: "/contact" },
    ],
  },
];

const defaultVnrLegalLinks: Footer6Link[] = [
  { label: "DMCA Notice", href: "/dmca" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "System Status", href: "/status" },
];

const defaultVnrSocialLinks: Footer6SocialLink[] = [
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

export function Footer6({
  logo,
  brandName = "VNR SCANS",
  tagLine = "VNR SCANS PLATFORM",
  headline = "Explore thousands of manga, manhwa & novels",
  description = "Experience the fastest scanlation reader on the web. Zero ads, instant chapter delivery, and cloud bookmark sync.",
  statusText = "HIGH PERFORMANCE SCANLATION READING ENGINE.",
  statusTag = "VNR SCANS",
  brandSubtitle = "A premium scanlation reading platform designed for the community.",
  copyright = "© 2026 VNR SCANS. All rights reserved.",
  linkGroups = defaultVnrLinkGroups,
  legalLinks = defaultVnrLegalLinks,
  socialLinks = defaultVnrSocialLinks,
}: Footer6Props) {
  const groupsToUse = linkGroups && linkGroups.length > 0 ? linkGroups : defaultVnrLinkGroups;
  const firstGroup = groupsToUse[0];
  const remainingGroups = groupsToUse.slice(1);
  const legalsToUse = legalLinks && legalLinks.length > 0 ? legalLinks : defaultVnrLegalLinks;
  const socialsToUse = socialLinks && socialLinks.length > 0 ? socialLinks : defaultVnrSocialLinks;

  return (
    <footer className="bg-[#06060a] text-neutral-300 relative w-full p-2 font-sans border-t border-white/10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        className="border-white/10 relative mx-auto w-full max-w-7xl border bg-black/40"
      >
        <GridTick className="-top-2 -left-2" />
        <GridTick className="-top-2 -right-2" />
        <GridTick className="-bottom-2 -left-2" />
        <GridTick className="-right-2 -bottom-2" />

        <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-14">
          <div className="border-white/10 relative col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r md:flex-row">
            {/* Left Headline & Explore Action (newsletter removed) */}
            <motion.div
              variants={techReveal}
              className="flex min-h-[260px] min-w-0 flex-1 flex-col gap-5 items-center text-center sm:items-start sm:text-left self-center overflow-clip p-5 sm:gap-6 sm:p-6 md:p-8 lg:col-span-6 lg:py-10"
            >
              <div className="pointer-events-none absolute top-1/2 -left-20 z-0 h-80 w-80 -translate-y-1/2 opacity-20 select-none">
                <svg className="text-neutral-600 h-full w-full" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1 5" />
                  <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
                  <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
                  <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
                  <circle cx="100" cy="30" r="2.5" fill="#a855f7" className="animate-pulse" />
                  <circle cx="150" cy="100" r="1.5" fill="#a855f7" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col gap-3.5 items-center text-center sm:items-start sm:text-left">
                {tagLine && (
                  <span className="text-purple-400 block text-xs font-bold tracking-widest uppercase">
                    //&nbsp;&nbsp;{tagLine}
                  </span>
                )}
                <h2 className="text-white max-w-lg text-2xl leading-[1.15] font-black tracking-tight sm:text-3xl lg:text-4xl">
                  {headline}
                </h2>
                <p className="text-neutral-400 max-w-md text-xs sm:text-sm leading-relaxed">
                  {description}
                </p>

                {/* Quick explore actions replacing newsletter */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <a
                    href="/browse"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-transform hover:scale-105 shadow-sm"
                  >
                    <span>Browse Catalog</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="https://discord.gg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-transform hover:scale-105"
                  >
                    <span>Discord Community</span>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* First Link Column */}
            <motion.div
              variants={techReveal}
              className="relative col-span-1 border-t md:border-t-0 md:border-l border-white/10 px-5 py-8 sm:px-6 md:px-6 md:py-10 lg:col-span-2"
            >
              {firstGroup && (
                <div className="flex flex-col gap-4 items-center text-center sm:items-start sm:text-left">
                  <div>
                    <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
                      //&nbsp;&nbsp;{firstGroup.title}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 items-center sm:items-start">
                    {firstGroup.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        className="text-neutral-400 hover:text-purple-300 block py-0.5 text-xs sm:text-sm font-medium transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <GridTick className="-top-2 -right-2" />
            <GridTick className="-right-2 -bottom-2" />
          </div>

          {/* Remaining Link Columns */}
          <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:col-span-6">
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-4">
              {remainingGroups.map((group) => (
                <motion.div
                  key={group.title}
                  variants={techReveal}
                  className="flex flex-col gap-4 items-center text-center sm:items-start sm:text-left"
                >
                  <div>
                    <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
                      //&nbsp;&nbsp;{group.title}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 items-center sm:items-start">
                    {group.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        className="text-neutral-400 hover:text-purple-300 block py-0.5 text-xs sm:text-sm font-medium transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Status ticker row */}
        <motion.div variants={techReveal} className="border-white/10 relative border-t px-5 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-medium text-emerald-400">
                {statusText}
              </span>
            </div>

            {statusTag && (
              <span className="text-purple-400 text-xs font-mono font-bold tracking-widest">
                [ {statusTag.toUpperCase()} ]
              </span>
            )}
          </div>
        </motion.div>

        {/* Bottom bar with branding, legal & socials (centralized on mobile) */}
        <motion.div
          variants={techReveal}
          className="flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8 border-t border-white/10 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex flex-col gap-3 items-center text-center sm:flex-row sm:items-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="vnr logo" width={24} height={24} className="h-6 w-6 rounded object-contain" />
              <span className="text-white text-base font-black tracking-wider uppercase">
                {brandName}
              </span>
            </div>

            {brandSubtitle && (
              <>
                <div className="hidden h-4 w-px bg-white/20 sm:block" />
                <p className="text-neutral-400 text-xs max-w-sm">
                  {brandSubtitle}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 lg:justify-end">
            <p className="text-neutral-500 text-xs">
              {copyright}
            </p>

            {legalsToUse.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {legalsToUse.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="text-neutral-400 hover:text-white text-xs font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {socialsToUse.length > 0 && (
              <div className="flex items-center justify-center gap-2 pt-1 sm:pt-0">
                {socialsToUse.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="text-neutral-400 hover:text-white flex items-center justify-center rounded-md p-2 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex h-4 w-4 items-center justify-center">
                      {link.icon}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}

export default Footer6;
