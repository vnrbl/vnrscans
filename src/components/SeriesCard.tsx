import { Link } from "@tanstack/react-router";
import { Star, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Series = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  type: string;
  rating_average: number | null;
  status?: string | null;
};

export function SeriesCard({ s }: { s: Series }) {
  return (
    <Link
      to="/series/$slug"
      params={{ slug: s.slug }}
      className="group block overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
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
        <div className="absolute left-2 top-2">
          <Badge variant="secondary" className="bg-background/80 text-xs uppercase backdrop-blur">
            {s.type}
          </Badge>
        </div>
        {s.rating_average && Number(s.rating_average) > 0 ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {Number(s.rating_average).toFixed(1)}
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
          {s.title}
        </h3>
      </div>
    </Link>
  );
}

export function SeriesCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-card">
      <div className="aspect-[2/3] animate-pulse bg-secondary" />
      <div className="p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}