import { Link } from "@/lib/router-compat";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TITLE_COVER_CLASS } from "@/components/titleCardStyles";
import { OptimizedImage } from "@/components/OptimizedImage";

type Series = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  type: string;
  rating_average: number | null;
  status?: string | null;
  chapter_count?: number | null;
};

export function SeriesCard({ s, rank }: { s: Series; rank?: number }) {
  return (
    <Link
      to="/title/$slug"
      params={{ slug: s.slug }}
      title={s.title}
      className="glass-card group block rounded-[4px] overflow-hidden hover-lift relative"
    >
      <div className={`${TITLE_COVER_CLASS} relative overflow-hidden bg-neutral-950`}>
        <OptimizedImage
          src={s.cover_url}
          alt={s.title}
          seriesId={s.id}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        
        {/* Cinematic bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />

        {rank !== undefined && (
          <div className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded bg-black/80 border border-neutral-700/80 text-xs font-mono font-bold text-white shadow-md backdrop-blur-md">
            #{rank}
          </div>
        )}
        
        <div className={rank !== undefined ? "absolute right-2.5 top-2.5" : "absolute left-2.5 top-2.5"}>
          <Badge variant="outline" className="badge-glass text-neutral-300 text-3xs uppercase tracking-[0.08em] py-0.5 px-2 font-semibold">
            {s.type}
          </Badge>
        </div>

        {s.rating_average && Number(s.rating_average) > 0 ? (
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded border border-white/10 bg-black/75 px-2 py-0.5 text-3xs backdrop-blur-md text-amber-300 font-mono font-bold shadow-sm transition-opacity group-hover:opacity-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 stroke-[1.5]" />
            {Number(s.rating_average).toFixed(1)}
          </div>
        ) : null}

        {/* Full Series Name Reveal On Hover */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black via-black/95 to-black/30 p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none max-h-full overflow-y-auto">
          <p className="text-xs font-bold leading-snug text-white break-words drop-shadow-md">
            {s.title}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium">
            <span className="uppercase font-semibold text-purple-400">{s.type}</span>
            {s.status && <span>• {s.status}</span>}
          </div>
        </div>
      </div>
      <div className="p-3 bg-surface-1/90">
        <h3
          title={s.title}
          className="line-clamp-1 text-sm font-semibold leading-snug text-white group-hover:text-purple-400 transition-colors duration-200"
        >
          {s.title}
        </h3>
        {s.chapter_count !== undefined && s.chapter_count !== null && s.chapter_count > 0 && (
          <p className="mt-1 text-xs text-neutral-400 font-normal">
            {s.chapter_count} {s.chapter_count === 1 ? "Chapter" : "Chapters"}
          </p>
        )}
      </div>
    </Link>
  );
}

export function SeriesCardSkeleton() {
  return (
    <div className="glass-card rounded-[4px] overflow-hidden">
      <div className={`${TITLE_COVER_CLASS} shimmer-dark`} />
      <div className="p-3.5 space-y-2">
        <div className="h-3 w-3/4 rounded shimmer-dark" />
        <div className="h-2.5 w-1/3 rounded shimmer-dark" />
      </div>
    </div>
  );
}