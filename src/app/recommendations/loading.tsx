export default function RecommendationsLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-border/40 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-48 rounded bg-secondary/70" />
          <div className="mt-2 h-4 w-80 rounded bg-secondary/50" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 w-40 rounded bg-secondary/70" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="overflow-hidden rounded-lg border border-border/40 bg-card">
                  <div className="aspect-[2/3] bg-secondary/70" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-secondary/70" />
                    <div className="h-2 w-1/2 rounded bg-secondary/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
