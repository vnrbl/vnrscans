export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-background pb-16 animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-border/40 px-4 py-8">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 space-y-3">
          <div className="h-4 w-32 rounded bg-secondary/50" />
          <div className="h-10 w-64 rounded bg-secondary/70" />
          <div className="h-4 w-96 max-w-full rounded bg-secondary/40" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 space-y-8">
        {/* Season Banner Skeleton */}
        <div className="h-24 rounded-2xl border border-border/40 bg-secondary/30" />

        {/* Podium Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-8">
          <div className="h-64 rounded-2xl border border-border/30 bg-secondary/30 md:order-1" />
          <div className="h-80 rounded-2xl border border-border/30 bg-secondary/40 md:order-2" />
          <div className="h-56 rounded-2xl border border-border/30 bg-secondary/30 md:order-3" />
        </div>

        {/* List Skeleton */}
        <div className="space-y-3 pt-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border/30 bg-secondary/20 p-3.5"
            >
              <div className="h-7 w-7 rounded-lg bg-secondary/60 flex-shrink-0" />
              <div className="h-11 w-11 rounded-full bg-secondary/70 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-secondary/60" />
                <div className="h-3 w-24 rounded bg-secondary/40" />
              </div>
              <div className="h-6 w-20 rounded bg-secondary/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
