"use client";

/**
 * AdSense integration for vnrscans.
 *
 * ─── Pre-approval state (now) ────────────────────────────────────
 * The AdSense library is NOT loaded. Both <AdSenseScript/> and
 * <AdUnit/> render nothing until you set
 *   NEXT_PUBLIC_ADSENSE_CLIENT="ca-pub-9873978314339869"
 * in your environment. This keeps the site clean for the AdSense
 * review and avoids loading the library before approval.
 *
 * ─── Post-approval ───────────────────────────────────────────────
 * Drop the env var, redeploy, and:
 *   - <AdSenseScript/> (rendered once in Providers) injects the
 *     official AdSense loader with your publisher ID.
 *   - <AdUnit slot="1234567890" /> drops a responsive ad where you
 *     place it.
 *
 * NOTE: Do not show ads on the chapter *reader* page itself — Google
 * policy forbids ads on pages dominated by third-party copyrighted
 * images. Keep ad units to listing/discovery/article-style pages.
 */

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";

export function isAdSenseEnabled() {
  // Must look like a real publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
  return /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT);
}

/** One-time AdSense library loader. Render once, near the app root. */
export function AdSenseScript() {
  if (!isAdSenseEnabled()) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}

type AdUnitProps = {
  /** Ad unit slot ID from your AdSense dashboard. */
  slot: string;
  /** Optional layout hint. */
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  /** Optional className for sizing. */
  className?: string;
  /** Accessible label for the ad container. */
  label?: string;
};

/**
 * A single responsive AdSense ad unit.
 * Renders nothing until AdSense is enabled.
 */
export function AdUnit({
  slot,
  format = "auto",
  className,
  label = "Advertisement",
}: AdUnitProps) {
  if (!isAdSenseEnabled()) return null;

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`.trim()}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
      aria-label={label}
    />
  );
}
