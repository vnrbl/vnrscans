import { Link } from "@tanstack/react-router";
import { Star, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TITLE_COVER_CLASS } from "@/components/titleCardStyles";

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
      className="group block overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className={TITLE_COVER_CLASS}>
        {s.cover_url ? (
          <img
            src={s.cover_url}
            alt={s.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
        {rank !== undefined && (
          <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white shadow-lg">
            #{rank}
          </div>
        )}
        <div className={rank !== undefined ? "absolute right-2 top-2" : "absolute left-2 top-2"}>
          <Badge variant="secondary" className="bg-background/80 text-xs uppercase backdrop-blur">
            {s.type}
          </Badge>
        </div>
        {s.rating_average && Number(s.rating_average) > 0 ? (
          <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {Number(s.rating_average).toFixed(1)}
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
          {s.title}
        </h3>
        {s.chapter_count && s.chapter_count > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {s.chapter_count} chapters
          </p>
        )}
      </div>
    </Link>
  );
}

export function SeriesCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-card">
      <div className={`${TITLE_COVER_CLASS} animate-pulse bg-secondary`} />
      <div className="p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}