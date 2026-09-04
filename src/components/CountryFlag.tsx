import React, { useId } from "react";

export function KoreaFlag({ className = "w-5 h-3.5" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 640 480"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Flag of South Korea (Manhwa)"
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width="640" height="480" rx="30" />
        </clipPath>
        <g id={`${id}-b`}>
          <rect x="-6" y="-26" width="12" height="2" fill="#000001" />
          <rect x="-6" y="-23" width="12" height="2" fill="#000001" />
          <rect x="-6" y="-20" width="12" height="2" fill="#000001" />
        </g>
        <g id={`${id}-trigram-pair`}>
          <use href={`#${id}-b`} />
          <rect x="-6" y="18" width="12" height="2" fill="#000001" />
          <rect x="-6" y="21" width="12" height="2" fill="#000001" />
          <rect x="-6" y="24" width="12" height="2" fill="#000001" />
        </g>
      </defs>
      <rect width="640" height="480" fill="#ffffff" />
      <g clipPath={`url(#${id}-clip)`}>
        <g transform="translate(320, 240) scale(10.66667)">
          {/* Top-left & bottom-right trigrams with Taegeuk */}
          <g transform="rotate(-56.3)">
            <use href={`#${id}-trigram-pair`} />
            <line y1="17" y2="27" stroke="#ffffff" strokeWidth="1" />
            <path d="M0 -12 a12 12 0 0 1 0 24 Z" fill="#cd2e3a" />
            <path d="M0 -12 a12 12 0 0 0 0 24 A6 6 0 0 0 0 0 Z" fill="#0047a0" />
            <circle cy="-6" r="6" fill="#cd2e3a" />
          </g>
          {/* Top-right & bottom-left trigrams */}
          <g transform="rotate(-123.7)">
            <use href={`#${id}-trigram-pair`} />
            <line y1="-23.5" y2="-20.5" stroke="#ffffff" strokeWidth="1" />
            <line y1="17" y2="20.5" stroke="#ffffff" strokeWidth="1" />
            <line y1="20.5" y2="23.5" stroke="#ffffff" strokeWidth="1" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function JapanFlag({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 480"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Flag of Japan (Manga)"
    >
      <rect width="640" height="480" fill="#ffffff" />
      <circle cx="320" cy="240" r="144" fill="#bc002d" />
    </svg>
  );
}

export function ChinaFlag({ className = "w-5 h-3.5" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 640 480"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Flag of China (Manhua)"
    >
      <defs>
        <path id={`${id}-star`} fill="#ffde00" d="M-.6.8 0-1 .6.8-1-.3h2z" />
      </defs>
      <rect width="640" height="480" fill="#ee1c25" />
      <use href={`#${id}-star`} width="30" height="20" transform="matrix(72 0 0 72 120 120)" />
      <use href={`#${id}-star`} width="30" height="20" transform="matrix(-12.33562 -20.5871 20.58684 -12.33577 240.3 48)" />
      <use href={`#${id}-star`} width="30" height="20" transform="matrix(-3.38573 -23.75998 23.75968 -3.38578 288 95.8)" />
      <use href={`#${id}-star`} width="30" height="20" transform="matrix(6.5991 -23.0749 23.0746 6.59919 288 168)" />
      <use href={`#${id}-star`} width="30" height="20" transform="matrix(14.9991 -18.73557 18.73533 14.99929 240 216)" />
    </svg>
  );
}

export function NovelFlag({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-mono text-[9px] font-bold ${className}`}>
      📖
    </div>
  );
}

export function CountryFlag({
  type,
  className = "w-5 h-3.5",
}: {
  type?: string | null;
  className?: string;
}) {
  const norm = (type || "").toLowerCase().trim();

  if (norm === "manhwa") {
    return <KoreaFlag className={className} />;
  }
  if (norm === "manga") {
    return <JapanFlag className={className} />;
  }
  if (norm === "manhua") {
    return <ChinaFlag className={className} />;
  }
  if (norm === "novel") {
    return <NovelFlag className={className} />;
  }

  // Default fallback
  return <KoreaFlag className={className} />;
}

export function getTypeLabel(type?: string | null): string {
  const norm = (type || "").toLowerCase().trim();
  if (norm === "manhwa") return "Manhwa (South Korea)";
  if (norm === "manga") return "Manga (Japan)";
  if (norm === "manhua") return "Manhua (China)";
  if (norm === "novel") return "Web Novel";
  return type || "Series";
}
