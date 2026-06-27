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
      className="card-spacex bg-surface-1 group block"
    >
      <div className={TITLE_COVER_CLASS}>
        <OptimizedImage
          src={s.cover_url}
          alt={s.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {rank !== undefined && (
          <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded bg-black/85 border border-neutral-800 text-xs font-mono font-bold text-white">
            #{rank}
          </div>
        )}
        <div className={rank !== undefined ? "absolute right-3 top-3" : "absolute left-3 top-3"}>
          <Badge variant="outline" className="bg-black/60 text-neutral-300 border-neutral-800 text-3xs uppercase tracking-[0.05em] py-0.5 px-2">
            {s.type}
          </Badge>
        </div>
        {s.rating_average && Number(s.rating_average) > 0 ? (
          <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded border border-neutral-800 bg-black/60 px-1.5 py-0.5 text-3xs backdrop-blur text-neutral-300">
            <Star className="h-3 w-3 fill-neutral-400 text-neutral-400 stroke-[1.5]" />
            {Number(s.rating_average).toFixed(1)}
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-xs font-bold leading-none text-white uppercase tracking-[0.02em] group-hover:text-neutral-200 transition-colors">
          {s.title}
        </h3>
      </div>
    </Link>
  );
}

export function SeriesCardSkeleton() {
  return (
    <div className="card-spacex bg-surface-1">
      <div className={`${TITLE_COVER_CLASS} animate-pulse bg-neutral-950`} />
      <div className="p-4">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-neutral-950" />
      </div>
    </div>
  );
}