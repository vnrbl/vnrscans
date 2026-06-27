import { SeriesCard, SeriesCardSkeleton } from "./SeriesCard";

export function SeriesGrid({
  items,
  loading,
  emptyMessage = "No series found.",
  showRank = false,
}: {
  items: Array<Parameters<typeof SeriesCard>[0]["s"]> | undefined;
  loading?: boolean;
  emptyMessage?: string;
  showRank?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <SeriesCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 p-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-4">
      {items.map((s, index) => (
        <SeriesCard key={s.id} s={s} rank={showRank ? index + 1 : undefined} />
      ))}
    </div>
  );
}
