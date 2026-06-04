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

const TYPE_COLORS: Record<string, string> = {
  manga:  "#60a5fa",
  manhwa: "#34d399",
  manhua: "#f59e0b",
  novel:  "#a78bfa",
};

// ─── Digital Dice Display ────────────────────────────────────────────────────
// Retro LED scoreboard / digital counter aesthetic
function DigitalDisplay({ value, isRolling }: { value: number; isRolling: boolean }) {
  return (
    <div
      style={{
        width: 210,
        height: 210,
        background: "linear-gradient(160deg, #0c0c0e 0%, #080809 100%)",
        borderRadius: 22,
        border: "2px solid rgba(220,38,38,0.5)",
        boxShadow: [
          "0 0 0 1px rgba(220,38,38,0.1)",
          "0 0 32px rgba(220,38,38,0.28)",
          "0 0 90px rgba(220,38,38,0.1)",
          "inset 0 0 60px rgba(0,0,0,0.75)",
        ].join(", "),
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
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)",
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
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Top label */}
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.24em",
          color: isRolling ? "rgba(220,38,38,0.55)" : "rgba(220,38,38,0.7)",
          textTransform: "uppercase",
          fontWeight: 700,
          fontFamily: "'Courier New', monospace",
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
          fontSize: 112,
          fontWeight: 900,
          fontFamily: "'Courier New', 'SF Mono', 'Roboto Mono', monospace",
          color: "#ff1a1a",
          textShadow: isRolling
            ? "0 0 8px #ff0000, 0 0 22px #ff0000, 0 0 45px rgba(255,0,0,0.4)"
            : "0 0 14px #ff0000, 0 0 38px #ff0000, 0 0 80px rgba(255,0,0,0.5)",
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
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: n <= value ? "#ff2222" : "rgba(220,38,38,0.15)",
              boxShadow: n <= value ? "0 0 7px #ff0000" : "none",
              transition: "all 0.15s",
            }}
          />
        ))}
      </div>

      {/* Corner brackets (decorative) */}
      {[
        { top: 10, left: 10, borderTop: "2px solid", borderLeft: "2px solid" },
        { top: 10, right: 10, borderTop: "2px solid", borderRight: "2px solid" },
        { bottom: 10, left: 10, borderBottom: "2px solid", borderLeft: "2px solid" },
        { bottom: 10, right: 10, borderBottom: "2px solid", borderRight: "2px solid" },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            borderColor: "rgba(220,38,38,0.35)",
            borderRadius: 2,
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
      from { opacity: 0; transform: translateY(-18px) scale(0.94); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes resultReveal {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes glowBreathe {
      0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
      50%      { opacity: 0.8; transform: translate(-50%, -50%) scale(1.07); }
    }
    @keyframes shadowPulse {
      0%, 100% { transform: scaleX(1);    opacity: 0.4; }
      50%      { transform: scaleX(0.82); opacity: 0.2; }
    }
    @keyframes digitFlip {
      0%   { transform: scaleY(0.25) translateY(-10px); opacity: 0.15; }
      55%  { transform: scaleY(1.06) translateY(3px);   opacity: 1; }
      100% { transform: scaleY(1)    translateY(0);      opacity: 1; }
    }
    @keyframes screenFlicker {
      0%, 95%, 100% { opacity: 1; }
      96%           { opacity: 0.88; }
      97%           { opacity: 1; }
      98%           { opacity: 0.92; }
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
          animation: "overlayFadeIn 0.25s ease forwards",
          overflowY: "auto",
        }}
      >
        {/* Blurred backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.86)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        />

        {/* Ambient red glow */}
        <div
          style={{
            position: "fixed",
            top: "40%",
            left: "50%",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(220,38,38,0.3) 0%, rgba(185,20,20,0.12) 45%, transparent 70%)",
            animation: "glowBreathe 2.2s ease-in-out infinite",
            pointerEvents: "none",
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
            gap: 22,
            animation: "contentSlideIn 0.38s cubic-bezier(0.34,1.2,0.64,1) forwards",
            maxWidth: "90vw",
            width: "100%",
            paddingTop: 44,
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
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.65)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
            }}
          >
            <X size={16} />
          </button>

          {/* Phase label */}
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.48)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              minHeight: 16,
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

          {/* Ground shadow */}
          <div
            style={{
              width: 170,
              height: 14,
              background:
                "radial-gradient(ellipse, rgba(180,0,0,0.28) 0%, transparent 70%)",
              borderRadius: "50%",
              marginTop: -18,
              animation: isCountingDown
                ? "shadowPulse 0.45s ease-in-out infinite"
                : undefined,
              transition: "opacity 0.3s",
            }}
          />

          {/* Result subtitle */}
          {showResults && (
            <div
              style={{
                textAlign: "center",
                animation: "resultReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.58)",
                  fontWeight: 500,
                }}
              >
                {diceResult === 1
                  ? "One random pick just for you ✨"
                  : `${diceResult} picks rolled — take your pick! ✨`}
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
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(220,38,38,0.4) transparent",
                animation: "resultReveal 0.45s 0.1s ease both",
              }}
            >
              {visibleSeries.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => onNavigate(s.slug)}
                  style={{
                    flexShrink: 0,
                    width: 118,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    overflow: "hidden",
                    cursor: "pointer",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transition:
                      "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
                    animation: `cardReveal 0.4s ${0.06 + idx * 0.045}s ease both`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "scale(1.05) translateY(-3px)";
                    el.style.background = "rgba(255,255,255,0.1)";
                    el.style.boxShadow = "0 10px 28px rgba(0,0,0,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "scale(1) translateY(0)";
                    el.style.background = "rgba(255,255,255,0.05)";
                    el.style.boxShadow = "none";
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
                          background: "#1e293b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BookOpen size={26} color="#4b5563" />
                      </div>
                    )}
                    {/* Cover gradient */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "45%",
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                      }}
                    />
                    {/* Type badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 9,
                        fontWeight: 800,
                        color: TYPE_COLORS[s.type] ?? "white",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        background: "rgba(0,0,0,0.65)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.type}
                    </div>
                  </div>
                  {/* Title */}
                  <div style={{ padding: "7px 8px 8px", width: "100%", display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.88)",
                        lineHeight: 1.35,
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
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>
              No series found. Try again!
            </p>
          )}

          {/* ─── Action buttons ─── */}
          {showResults && (
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={onRollAgain}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 22px",
                  background: "rgba(220,38,38,0.18)",
                  border: "1px solid rgba(220,38,38,0.35)",
                  borderRadius: 9999,
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(220,38,38,0.28)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(220,38,38,0.6)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(220,38,38,0.18)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(220,38,38,0.35)";
                }}
              >
                <RotateCcw size={14} />
                Roll Again
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 22px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 9999,
                  color: "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLElement).style.color = "white";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.55)";
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
