"use client";

import React from "react";
import { Crown, Sparkles, Flame } from "lucide-react";

export interface UserAvatarFrameProps {
  avatarUrl?: string | null;
  avatarFrame?: string | null;
  accentColor?: string | null;
  username?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatarFrame({
  avatarUrl,
  avatarFrame = "none",
  accentColor = "#8B5CF6",
  username = "User",
  size = 28,
  className = "",
}: UserAvatarFrameProps) {
  const frame = avatarFrame || "none";
  const accent = accentColor || "#8B5CF6";
  const borderWidth = frame === "creator" ? 2.5 : 2;
  const innerSize = Math.max(16, size - borderWidth * 2);

  const getFrameGradient = () => {
    switch (frame) {
      case "neon":
        return "conic-gradient(from 0deg, #A855F7, #06B6D4, #EC4899, #A855F7)";
      case "gold":
        return "conic-gradient(from 0deg, #a67c00, #ffd700, #ffeb99, #ffd700, #a67c00)";
      case "cyber":
        return "conic-gradient(from 0deg, #0ea5e9, transparent 30%, #c084fc, transparent 60%, #0ea5e9)";
      case "fire":
        return "conic-gradient(from 0deg, #b91c1c, #f97316, #ef4444, #b91c1c)";
      case "sakura":
        return "conic-gradient(from 0deg, #FDA4AF, #F472B6, #E879F9, #FDA4AF)";
      case "shadow":
        return "conic-gradient(from 0deg, #4f46e5, #06b6d4, #1e1b4b, #4f46e5)";
      case "qi":
        return "conic-gradient(from 0deg, #059669, #10B981, #FBBF24, #059669)";
      case "asura":
        return "conic-gradient(from 0deg, #ef4444, #7f1d1d, #ef4444)";
      case "system":
        return "conic-gradient(from 0deg, #06B6D4, transparent 30%, #06B6D4 50%, transparent 70%, #06B6D4)";
      case "abyss":
        return "conic-gradient(from 0deg, #D946EF, #4A044E, #3B0764, #D946EF)";
      case "glitch":
        return "conic-gradient(from 0deg, #ef4444, #06b6d4, #ef4444)";
      case "divine":
        return "conic-gradient(from 0deg, #FCD34D, #FFFFFF, #FFFBEB, #FCD34D)";
      case "creator":
        return `conic-gradient(from 0deg, ${accent}, transparent, ${accent}80, transparent, ${accent})`;
      case "bronze":
        return "conic-gradient(from 0deg, #8c521a, #cd7f32, #ffb677, #cd7f32, #8c521a)";
      case "iron":
        return "conic-gradient(from 0deg, #3a4454, #708090, #b0c4de, #708090, #3a4454)";
      case "silver":
        return "conic-gradient(from 0deg, #7f7f7f, #C0C0C0, #ffffff, #C0C0C0, #7f7f7f)";
      case "platinum":
        return "conic-gradient(from 0deg, #A0B2C6, #E5E4E2, #ffffff, #E5E4E2, #A0B2C6)";
      default:
        return accent;
    }
  };

  const getFrameGlow = () => {
    switch (frame) {
      case "neon":
        return "0 0 8px rgba(168,85,247,0.5), 0 0 14px rgba(6,182,212,0.3)";
      case "gold":
        return "0 0 8px rgba(255,215,0,0.5), 0 0 14px rgba(255,215,0,0.25)";
      case "cyber":
        return "0 0 8px rgba(6,182,212,0.5), 0 0 12px rgba(192,132,252,0.25)";
      case "fire":
        return "0 0 9px rgba(239,68,68,0.6), 0 0 14px rgba(249,115,22,0.3)";
      case "sakura":
        return "0 0 8px rgba(244,114,182,0.5), 0 0 12px rgba(233,121,249,0.25)";
      case "shadow":
        return "0 0 9px rgba(99,102,241,0.6), 0 0 14px rgba(6,182,212,0.2)";
      case "qi":
        return "0 0 8px rgba(16,185,129,0.5), 0 0 12px rgba(251,191,36,0.25)";
      case "asura":
        return "0 0 9px rgba(239,68,68,0.7), 0 0 16px rgba(127,29,29,0.4)";
      case "system":
        return "0 0 8px rgba(6,182,212,0.6), 0 0 12px rgba(6,182,212,0.3)";
      case "abyss":
        return "0 0 9px rgba(217,70,239,0.6), 0 0 14px rgba(139,92,246,0.3)";
      case "glitch":
        return "0 0 8px rgba(239,68,68,0.5), 0 0 12px rgba(6,182,212,0.3)";
      case "divine":
        return "0 0 9px rgba(252,211,77,0.6), 0 0 14px rgba(255,255,255,0.3)";
      case "creator":
        return `0 0 9px ${accent}, 0 0 15px ${accent}60`;
      case "bronze":
        return "0 0 6px rgba(205,127,50,0.5)";
      case "iron":
        return "0 0 6px rgba(112,128,144,0.5)";
      case "silver":
        return "0 0 6px rgba(192,192,192,0.5)";
      case "platinum":
        return "0 0 6px rgba(229,228,226,0.55)";
      default:
        return `0 0 4px ${accent}40`;
    }
  };

  const isAnimated = frame !== "none";
  const animSpeed =
    frame === "fire"
      ? "1.5s"
      : frame === "neon"
      ? "2s"
      : frame === "abyss"
      ? "4.5s"
      : frame === "glitch"
      ? "1.2s"
      : "3s";

  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={`relative rounded-full flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: isAnimated ? getFrameGlow() : undefined,
      }}
    >
      {/* Rotating frame border */}
      {isAnimated && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: getFrameGradient(),
            animation: `navRotCW ${animSpeed} linear infinite`,
          }}
        />
      )}

      {/* Static frame border for 'none' */}
      {!isAnimated && (
        <div
          className="absolute inset-0 rounded-full border border-border/70 pointer-events-none"
          style={{ borderColor: `${accent}50` }}
        />
      )}

      {/* Inner background mask */}
      <div
        className="absolute rounded-full bg-background pointer-events-none"
        style={{
          inset: isAnimated ? borderWidth : 1,
        }}
      />

      {/* Avatar image or fallback initial */}
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center bg-card z-10"
        style={{
          width: isAnimated ? innerSize : size - 2,
          height: isAnimated ? innerSize : size - 2,
          animation: isAnimated ? `navPulse 4s ease-in-out infinite` : undefined,
        }}
      >
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={username || "User"}
            width={innerSize}
            height={innerSize}
            className="h-full w-full object-cover rounded-full"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${accent}30, ${accent}10)`,
              color: accent,
            }}
          >
            {username?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
      </div>

      {/* Mini Frame Badges */}
      {frame === "creator" && (
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-amber-400 z-20 pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          style={{ color: accent }}
        >
          <Crown className="h-2.5 w-2.5 fill-current" />
        </div>
      )}

      {frame === "gold" && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-400 z-20 pointer-events-none drop-shadow-sm">
          <Crown className="h-2 w-2 fill-amber-400" />
        </div>
      )}

      {frame === "fire" && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-orange-500 z-20 pointer-events-none drop-shadow-[0_0_4px_#ef4444]">
          <Flame className="h-2 w-2 fill-orange-500" />
        </div>
      )}

      {frame === "divine" && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-yellow-300 z-20 pointer-events-none">
          <Sparkles className="h-2 w-2" />
        </div>
      )}

      {frame === "cyber" && (
        <div className="absolute inset-[-1px] pointer-events-none z-20">
          <div className="absolute top-0 left-0 h-1 w-1 border-t border-l border-cyan-400 rounded-tl-sm" />
          <div className="absolute top-0 right-0 h-1 w-1 border-t border-r border-cyan-400 rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 h-1 w-1 border-b border-l border-cyan-400 rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-cyan-400 rounded-br-sm" />
        </div>
      )}

      {frame === "system" && (
        <div className="absolute -top-1 -right-1 z-30 bg-slate-950 border border-cyan-400 text-cyan-400 text-[6px] font-black px-0.5 rounded leading-tight">
          S
        </div>
      )}
    </div>
  );
}
export default UserAvatarFrame;
