import { Link } from "@tanstack/react-router";
import { ShieldCheck, Mail, ExternalLink, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-secondary/10 text-muted-foreground transition-all">
      {/* Top half */}
      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-12">
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-center sm:text-left">
          {/* Logo & Description */}
          <div className="flex flex-col items-center sm:items-start space-y-4">
            <Link to="/home" className="flex items-center gap-2 transition-transform hover:scale-102 w-fit">
              <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-violet-600 font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.35)]">
                VS
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">
                vnrscans
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-xs">
              A premium, lightning-fast scanlation reading platform designed for the community. Fast loading, secure, and fully optimized.
            </p>
            {/* Safe / Trusted Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 text-emerald-500 text-3xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" /> DMCA Compliant
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/home" className="hover:text-primary transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-primary transition-colors">Browse Directory</Link>
              </li>
              <li>
                <Link to="/rankings" className="hover:text-primary transition-colors">Top Rankings</Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-primary transition-colors">Recommendations</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">Legal & Support</h4>
            <ul className="space-y-2 text-xs flex flex-col items-center sm:items-start">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">About Platform</Link>
              </li>
              <li>
                <Link to="/dmca" className="hover:text-primary transition-colors">DMCA Takedown</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">Inquiries & Contact</Link>
              </li>
              <li>
                <a href="mailto:hello@vnrscans.com" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Mail className="h-3 w-3" /> hello@vnrscans.com
                </a>
              </li>
            </ul>
          </div>

          {/* Community & Socials */}
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">Community</h4>
            <ul className="space-y-2.5 text-xs flex flex-col items-center sm:items-start">
              <li>
                <a
                  href="https://discord.gg/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <svg className="h-3.5 w-3.5 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord Server
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <svg className="h-3.5 w-3.5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <svg className="h-3 w-3 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="border-t border-border/20 bg-secondary/5 py-6">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-3xs text-muted-foreground/80 leading-normal max-w-xl">
            © {new Date().getFullYear()} vnrscans. All rights reserved. vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.
          </p>
          <div className="flex items-center gap-2 text-3xs text-muted-foreground/50">
            <span>Powered by React & Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}