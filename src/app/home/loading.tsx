export default function HomeLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <div className="h-72 w-full bg-secondary/50 rounded-none" />

      {/* Section skeletons */}
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 w-48 rounded bg-secondary/70" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, j) => (
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
