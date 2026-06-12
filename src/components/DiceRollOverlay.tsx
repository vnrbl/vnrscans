import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, BookOpen, RotateCcw } from "lucide-react";

export interface DiceSeries {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  type: string;
}

interface DiceRollOverlayProps {
  open: boolean;
  diceResult: number | null;
  series: DiceSeries[];
  onClose: () => void;
  onNavigate: (slug: string) => void;
  onRollAgain: () => void;
}

// ─── Digital Dice Display ────────────────────────────────────────────────────
// Minimalist, industrial monochrome counter
function DigitalDisplay({ value, isRolling }: { value: number; isRolling: boolean }) {
  return (
    <div
      style={{
        width: 210,
        height: 210,
        background: "#050505",
        borderRadius: 4, // SpaceX: 4px radius
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 0 24px rgba(255,255,255,0.03)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        gap: 8,
      }}
    >
      {/* CRT scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
      {/* Screen vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Top label */}
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          color: isRolling ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)",
          textTransform: "uppercase",
          fontWeight: 700,
          fontFamily: "inherit",
          position: "relative",
          zIndex: 4,
          transition: "color 0.3s",
        }}
      >
        DICE ROLL
      </div>

      {/* The big digital number */}
      <div
        key={`${value}-${isRolling}`}
        style={{
          fontSize: 108,
          fontWeight: 700,
          fontFamily: "'Courier New', monospace",
          color: "#ffffff",
          textShadow: isRolling
            ? "0 0 12px rgba(255,255,255,0.2)"
            : "0 0 20px rgba(255,255,255,0.3)",
          lineHeight: 1,
          animation: "digitFlip 0.09s ease-out",
          position: "relative",
          zIndex: 4,
          userSelect: "none",
          letterSpacing: "-0.04em",
          transition: "text-shadow 0.3s",
        }}
      >
        {value}
      </div>

      {/* Indicator pips — highlight current value */}
      <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 4 }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: n <= value ? "#ffffff" : "rgba(255,255,255,0.12)",
              boxShadow: n <= value ? "0 0 8px rgba(255,255,255,0.6)" : "none",
              transition: "all 0.15s",
            }}
          />
        ))}
      </div>

      {/* Corner brackets (decorative) */}
      {[
        { top: 12, left: 12, borderTop: "1.5px solid", borderLeft: "1.5px solid" },
        { top: 12, right: 12, borderTop: "1.5px solid", borderRight: "1.5px solid" },
        { bottom: 12, left: 12, borderBottom: "1.5px solid", borderLeft: "1.5px solid" },
        { bottom: 12, right: 12, borderBottom: "1.5px solid", borderRight: "1.5px solid" },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            borderColor: "rgba(255,255,255,0.2)",
            zIndex: 4,
            ...s,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────
export function DiceRollOverlay({
  open,
  diceResult,
  series,
  onClose,
  onNavigate,
  onRollAgain,
}: DiceRollOverlayProps) {
  const [showResults, setShowResults] = useState(false);
  const [displayValue, setDisplayValue] = useState(1);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Start digital counter animation when overlay opens
  useEffect(() => {
    if (!open || diceResult === null) return;

    setShowResults(false);
    setIsCountingDown(true);
    setDisplayValue(Math.floor(Math.random() * 6) + 1);

    let elapsed = 0;
    let delay = 48;
    let t: ReturnType<typeof setTimeout>;

    const cycle = () => {
      elapsed += delay;
      if (elapsed >= 2500) {
        setDisplayValue(diceResult);
        setIsCountingDown(false);
        setTimeout(() => setShowResults(true), 380);
        return;
      }
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      // Gradually slow down (slot-machine deceleration)
      delay = Math.min(delay + 6, 380);
      t = setTimeout(cycle, delay);
    };

    t = setTimeout(cycle, delay);
    return () => clearTimeout(t);
  }, [open, diceResult]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setShowResults(false);
      setIsCountingDown(false);
    }
  }, [open]);

  if (!open || diceResult === null) return null;

  const visibleSeries = series.slice(0, diceResult);

  const css = `
    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes contentSlideIn {
      from { opacity: 0; transform: translateY(-16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes resultReveal {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes digitFlip {
      0%   { transform: scaleY(0.25) translateY(-5px); opacity: 0.15; }
      55%  { transform: scaleY(1.05) translateY(2px);   opacity: 1; }
      100% { transform: scaleY(1)    translateY(0);      opacity: 1; }
    }
    @keyframes screenFlicker {
      0%, 95%, 100% { opacity: 1; }
      96%           { opacity: 0.9; }
      97%           { opacity: 1; }
      98%           { opacity: 0.94; }
    }
  `;

  const content = (
    <>
      <style>{css}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          animation: "overlayFadeIn 0.2s ease forwards",
          overflowY: "auto",
        }}
      >
        {/* Blurred backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            animation: "contentSlideIn 0.3s ease forwards",
            maxWidth: "90vw",
            width: "100%",
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 32,
              height: 32,
              borderRadius: 4,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.4)";
              (e.currentTarget as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <X size={14} />
          </button>

          {/* Phase label */}
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.4)",
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontWeight: 700,
              minHeight: 16,
              fontFamily: "inherit",
            }}
          >
            {showResults
              ? "🎲 The dice has spoken"
              : isCountingDown
              ? "Rolling the dice…"
              : ""}
          </p>

          {/* ─── Digital Display ─── */}
          <div
            style={{
              animation: isCountingDown
                ? "screenFlicker 3s ease-in-out infinite"
                : undefined,
            }}
          >
            <DigitalDisplay value={displayValue} isRolling={isCountingDown} />
          </div>

          {/* Ground shadow (very minimal) */}
          <div
            style={{
              width: 170,
              height: 10,
              background:
                "radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%)",
              borderRadius: "50%",
              marginTop: -16,
              transition: "opacity 0.3s",
            }}
          />

          {/* Result subtitle */}
          {showResults && (
            <div
              style={{
                textAlign: "center",
                animation: "resultReveal 0.4s ease forwards",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                }}
              >
                {diceResult === 1
                  ? "ONE RANDOM RECOMMENDATION FOR YOU"
                  : `${diceResult} MONOCHROME PICKS GENERATED`}
              </p>
            </div>
          )}

          {/* ─── Series cards — single horizontal row ─── */}
          {showResults && visibleSeries.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 12,
                justifyContent: visibleSeries.length * 128 < 820 ? "center" : "flex-start",
                overflowX: "auto",
                maxWidth: "min(90vw, 820px)",
                width: "100%",
                paddingBottom: 12,
                scrollbarWidth: "none",
                animation: "resultReveal 0.45s 0.05s ease both",
              }}
            >
              {visibleSeries.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => onNavigate(s.slug)}
                  style={{
                    flexShrink: 0,
                    width: 118,
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 4, // SpaceX: 4px radius
                    overflow: "hidden",
                    cursor: "pointer",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transition:
                      "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
                    animation: `cardReveal 0.4s ${0.06 + idx * 0.045}s ease both`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(-3px)";
                    el.style.borderColor = "rgba(255,255,255,0.3)";
                    el.style.background = "#121212";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(0)";
                    el.style.borderColor = "rgba(255,255,255,0.1)";
                    el.style.background = "#0a0a0a";
                  }}
                >
                  {/* Cover image */}
                  <div
                    style={{ aspectRatio: "2/3", overflow: "hidden", position: "relative", width: "100%" }}
                  >
                    {s.cover_url ? (
                      <img
                        src={s.cover_url}
                        alt={s.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#080808",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BookOpen size={24} color="#333" />
                      </div>
                    )}
                    {/* Cover gradient */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "50%",
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.95), transparent)",
                      }}
                    />
                    {/* Type badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 8,
                        fontWeight: 700,
                        color: "#c0c0c0",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        background: "rgba(0,0,0,0.75)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        padding: "2px 6px",
                        borderRadius: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.type}
                    </div>
                  </div>
                  {/* Title */}
                  <div style={{ padding: "8px", width: "100%", display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#ffffff",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        textAlign: "center",
                      }}
                    >
                      {s.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && visibleSeries.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0, textTransform: "uppercase" }}>
              No series found. Try again!
            </p>
          )}

          {/* ─── Action buttons ─── */}
          {showResults && (
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <button
                onClick={onRollAgain}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "#ffffff",
                  border: "1px solid transparent",
                  borderRadius: 24,
                  color: "#000000",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  transition: "background 0.2s, opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                <RotateCcw size={13} strokeWidth={2.5} />
                Roll Again
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.6)",
                  borderRadius: 24,
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "white";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.6)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
