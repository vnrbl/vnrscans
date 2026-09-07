"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@/lib/router-compat";

export interface Footer20Props {
  brandName?: string;
  description?: string;
  email?: string;
}

export default function Footer20({
  brandName = "VNR SCANS",
  description = "A premium, lightning-fast scanlation reading platform designed for the manga, manhwa, and manhua community.",
  email = "support@vnrscans.com",
}: Footer20Props) {
  return (
    <footer className="relative border-t border-white/10 bg-[#06060a] text-neutral-400 overflow-hidden pt-12 pb-6">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Brand & Description */}
          <div className="md:col-span-6 space-y-4">
            <Link to="/home" className="flex items-center gap-2.5 w-fit">
              <img src="/favicon.svg" alt="vnr logo" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
              <span className="text-xl font-black text-white tracking-widest uppercase">{brandName}</span>
            </Link>
            <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
              {description}
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              Inquiries: <a href={`mailto:${email}`} className="text-purple-400 hover:underline">{email}</a>
            </p>
          </div>

          {/* Links columns */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Directory</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/home" className="hover:text-white transition-colors">Home Page</Link></li>
              <li><Link to="/browse" className="hover:text-white transition-colors">Browse Manga</Link></li>
              <li><Link to="/rankings" className="hover:text-white transition-colors">Top Rankings</Link></li>
              <li><Link to="/novels" className="hover:text-white transition-colors">Light Novels</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Policies</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dmca" className="hover:text-white transition-colors">DMCA Notice</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Security Center</Link></li>
            </ul>
          </div>
        </div>

        {/* Big Stylized Typography Backdrop */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2026 {brandName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
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