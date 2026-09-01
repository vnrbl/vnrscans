export default function RankingsLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-border/40 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-48 rounded bg-secondary/70" />
          <div className="mt-2 h-4 w-72 rounded bg-secondary/50" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border/40 bg-card p-3">
            <div className="h-8 w-8 rounded-full bg-secondary/70 flex-shrink-0" />
            <div className="h-16 w-12 rounded bg-secondary/70 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-secondary/70" />
              <div className="h-3 w-24 rounded bg-secondary/50" />
            </div>
            <div className="h-4 w-16 rounded bg-secondary/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
