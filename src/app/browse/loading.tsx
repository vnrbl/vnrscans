export default function BrowseLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Filter bar skeleton */}
      <div className="border-b border-border/40 bg-background/80 px-4 py-4">
        <div className="mx-auto max-w-7xl flex flex-wrap gap-3 items-center">
          <div className="h-9 w-56 rounded-md bg-secondary/70" />
          <div className="h-9 w-36 rounded-md bg-secondary/70" />
          <div className="h-9 w-36 rounded-md bg-secondary/70" />
          <div className="h-9 w-36 rounded-md bg-secondary/70" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border/40 bg-card">
              <div className="aspect-[2/3] bg-secondary/70" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-secondary/70" />
                <div className="h-2 w-1/2 rounded bg-secondary/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
