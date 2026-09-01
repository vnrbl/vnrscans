export default function TitleLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Cover + metadata skeleton */}
      <div className="relative">
        {/* Blurred backdrop */}
        <div className="absolute inset-0 h-72 bg-secondary/50" />

        <div className="relative mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {/* Cover */}
            <div className="h-56 w-40 flex-shrink-0 rounded-xl bg-secondary/70 shadow-2xl" />

            {/* Info */}
            <div className="flex-1 space-y-3 pb-2">
              <div className="h-7 w-64 rounded bg-secondary/70" />
              <div className="h-4 w-40 rounded bg-secondary/50" />
              <div className="flex gap-2 flex-wrap mt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 w-16 rounded-full bg-secondary/60" />
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <div className="h-9 w-32 rounded-md bg-secondary/70" />
                <div className="h-9 w-32 rounded-md bg-secondary/60" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description + chapters skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-secondary/50" />
          <div className="h-4 w-5/6 rounded bg-secondary/50" />
          <div className="h-4 w-4/6 rounded bg-secondary/40" />
        </div>

        <div className="space-y-3 pt-4">
          <div className="h-6 w-32 rounded bg-secondary/70" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border/40 bg-card px-4 py-3">
              <div className="h-4 w-32 rounded bg-secondary/70" />
              <div className="h-3 w-24 rounded bg-secondary/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
