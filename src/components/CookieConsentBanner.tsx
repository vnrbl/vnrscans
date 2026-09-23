"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { getCookieConsent, setCookieConsent } from "@/lib/cookie-settings";

/**
 * CookieConsentBanner — GDPR-style Accept / Reject prompt for first-time
 * (or long-absent) visitors. Renders nothing once a choice is stored.
 * Listens for consent changes so it can reappear if storage is cleared.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(getCookieConsent() === null);
    sync();
    window.addEventListener("vnr-cookie-consent-change", sync);
    return () => window.removeEventListener("vnr-cookie-consent-change", sync);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-[100] sm:right-auto sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="rounded-xl border border-border/60 bg-[rgba(6,6,8,0.85)] backdrop-blur-xl shadow-2xl shadow-black/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Cookie className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">We use cookies</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              vnrscans uses a single preference cookie to remember your reader
              settings — font, theme, text size — across visits. No tracking, no
              ads, no third parties. Read our{" "}
              <Link
                href="/privacy"
                className="focus-ring underline underline-offset-2 hover:text-primary rounded-sm"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCookieConsent("accepted")}
            className="focus-ring flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Accept cookies
          </button>
          <button
            type="button"
            onClick={() => setCookieConsent("rejected")}
            className="focus-ring flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
