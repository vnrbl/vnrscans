import { ImageResponse } from "next/og";

/**
 * Default Open Graph image for the site.
 *
 * Next.js automatically wires this up as `og:image` in the metadata of every
 * page that doesn't override it, so links shared to Twitter/X, Facebook,
 * Discord, WhatsApp, etc. render a branded card instead of nothing.
 *
 * Served at /opengraph-image (1200x630 — the size every social platform
 * expects).
 *
 * SATORI GOTCHAS (this file has been bitten before — keep following them):
 *  - `<br />` does NOT work inside flex text; it silently vanishes and both
 *    halves fuse into one overflowing line. Always use one child div per line.
 *  - Text never wraps automatically. Size every line to fit its container.
 *  - A real bold font must be supplied or heavy weights fall back thin.
 */

export const runtime = "edge";
export const alt = "vnrscans — Read Manga, Manhwa, Manhua & Novels Online Free";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS = {
  bg0: "#0b0b12",
  bg1: "#101018",
  bg2: "#17102c",
  white: "#fafafa",
  muted: "#a1a1aa",
  faint: "#71717a",
  violet: "#8b5cf6",
  violetLight: "#a78bfa",
  indigo: "#6366f1",
  pink: "#ec4899",
  cyan: "#22d3ee",
};

/** Fetch real Inter weights so the heavy headline isn't synthesized/thin. */
async function loadInterFonts() {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap",
      {
        headers: {
          // A plain UA makes Google serve TTF — Satori can't parse WOFF2.
          "User-Agent": "curl/8.0",
        },
      }
    ).then((r) => r.text());

    const fonts: {
      name: string;
      data: ArrayBuffer;
      weight: 400 | 500 | 700 | 800;
      style: "normal";
    }[] = [];
    for (const block of css.split("@font-face").slice(1)) {
      const weight = Number(block.match(/font-weight:\s*(\d+)/)?.[1] ?? 0);
      const url = block.match(/url\((https:[^)]+)\)/)?.[1];
      if (!weight || !url || fonts.some((f) => f.weight === weight)) continue;
      const data = await fetch(url).then((r) => r.arrayBuffer());
      fonts.push({ name: "Inter", data, weight: weight as 400 | 500 | 700 | 800, style: "normal" });
    }
    return fonts.length >= 2 ? fonts : undefined;
  } catch {
    // Offline / blocked CDN — fall back to the built-in font. Still looks fine.
    return undefined;
  }
}

function Panel({
  children,
  width,
  accent = false,
}: {
  children?: React.ReactNode;
  width: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        width,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: accent ? "center" : "flex-start",
        alignItems: "center",
        borderRadius: 22,
        overflow: "hidden",
        position: "relative",
        padding: accent ? 0 : 26,
        border: "1px solid rgba(255,255,255,0.10)",
        background: accent
          ? `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.indigo})`
          : "linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.012))",
      }}
    >
      {children}
    </div>
  );
}

/** Fake dialogue/caption lines — reads as a manga page at a glance. */
function TextBars({ widths }: { widths: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 13 }}>
      {widths.map((w, i) => (
        <div
          key={i}
          style={{
            width: w,
            height: 12,
            borderRadius: 999,
            background: "rgba(255,255,255,0.10)",
            display: "flex",
          }}
        />
      ))}
    </div>
  );
}

export default async function OgImage() {
  const fonts = await loadInterFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, ${COLORS.bg0} 0%, ${COLORS.bg1} 45%, ${COLORS.bg2} 100%)`,
          fontFamily: "Inter",
        }}
      >
        {/* ── Ambient glows ─────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -180,
            width: 720,
            height: 720,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(139,92,246,0.28), transparent 68%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -140,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(34,211,238,0.14), transparent 70%)`,
            display: "flex",
          }}
        />

        {/* ── Top accent bar ────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${COLORS.violet}, ${COLORS.pink} 50%, ${COLORS.cyan})`,
            display: "flex",
          }}
        />

        {/* ── Main content row ──────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            padding: "0 60px",
            gap: 40,
          }}
        >
          {/* Left column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              zIndex: 1,
            }}
          >
            {/* Logo lockup */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.indigo})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                  fontWeight: 800,
                  color: "white",
                  boxShadow: "0 8px 24px rgba(139,92,246,0.35)",
                }}
              >
                V
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  fontWeight: 700,
                  color: COLORS.white,
                  letterSpacing: 7,
                }}
              >
                VNRSCANS
              </div>
            </div>

            {/* Headline — one div per line (Satori ignores <br/>) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 40,
                fontSize: 64,
                fontWeight: 800,
                color: COLORS.white,
                lineHeight: 1.12,
                letterSpacing: -2,
              }}
            >
              <div style={{ display: "flex" }}>Read Manga, Manhwa</div>
              <div
                style={{
                  display: "flex",
                  color: COLORS.violetLight,
                }}
              >
                &amp; Manhua Free
              </div>
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", gap: 14, marginTop: 38 }}>
              {["Fast updates", "HD chapters", "Gamified reader"].map((label, i) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 20px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 19,
                    fontWeight: 500,
                    color: "#e4e4e7",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: [COLORS.violet, COLORS.pink, COLORS.cyan][i],
                      display: "flex",
                    }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right visual — stylized manga panel grid */}
          <div
            style={{
              width: 340,
              height: 430,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              transform: "rotate(2deg)",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", height: "45%", gap: 14 }}>
              {/* Accent panel: brand mark on halftone dots */}
              <Panel width="55%" accent>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.22) 1.4px, transparent 1.4px)",
                    backgroundSize: "12px 12px",
                    display: "flex",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    fontSize: 88,
                    fontWeight: 800,
                    color: "white",
                    zIndex: 1,
                  }}
                >
                  V
                </div>
              </Panel>
              <Panel width="45%">
                <TextBars widths={["85%", "60%", "72%"]} />
              </Panel>
            </div>
            <div style={{ display: "flex", height: "55%", gap: 14 }}>
              <Panel width="45%">
                <TextBars widths={["70%", "88%", "50%", "64%"]} />
              </Panel>
              {/* Halftone panel with glow dot */}
              <div
                style={{
                  width: "55%",
                  height: "100%",
                  borderRadius: 22,
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: `linear-gradient(160deg, rgba(139,92,246,0.16), rgba(34,211,238,0.07))`,
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.09) 1.4px, transparent 1.4px)",
                  backgroundSize: "14px 14px",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.pink})`,
                    boxShadow: "0 10px 30px rgba(139,92,246,0.45)",
                    display: "flex",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 60,
            right: 60,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "12px 26px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 24,
              fontWeight: 600,
              color: COLORS.violetLight,
            }}
          >
            www.vnrscans.com
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 19,
              fontWeight: 500,
              letterSpacing: 4,
              color: COLORS.faint,
            }}
          >
            MANGA · MANHWA · MANHUA · NOVELS
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
