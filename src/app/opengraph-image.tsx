import { ImageResponse } from "next/og";

/**
 * Default Open Graph image for the site.
 *
 * Next.js automatically wires this up as `og:image` in the metadata of every
 * page that doesn't override it, so links shared to Twitter, Facebook,
 * Discord, etc. render a branded card instead of nothing.
 *
 * Served at /opengraph-image (1200x630 — the size every social platform
 * expects).
 */

export const runtime = "edge";
export const alt = "vnrscans — Read Manga, Manhwa, Manhua & Novels Online Free";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #131318 50%, #1a1030 100%)",
          padding: "80px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo lockup */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 40,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 800,
              color: "white",
            }}
          >
            V
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: 6 }}>
            VNRSCANS
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.05,
            letterSpacing: -1,
            maxWidth: 900,
            zIndex: 1,
          }}
        >
          Read Manga, Manhwa
          <br />
          &amp; Manhua Free
        </div>

        {/* Subhead */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#a1a1aa",
            marginTop: 28,
            maxWidth: 800,
            zIndex: 1,
          }}
        >
          Fast updates · HD chapters · Gamified reader experience
        </div>

        {/* URL bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 60,
            padding: "14px 28px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: 26,
            color: "#c4b5fd",
            fontWeight: 600,
            zIndex: 1,
          }}
        >
          www.vnrscans.com
        </div>
      </div>
    ),
    { ...size }
  );
}
