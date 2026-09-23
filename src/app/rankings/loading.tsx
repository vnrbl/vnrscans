export default function RankingsLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
        {/* Header skeleton */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl shimmer-dark" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded shimmer-dark" />
            <div className="h-4 w-72 rounded shimmer-dark" />
          </div>
        </div>
        {/* Tabs skeleton */}
        <div className="mb-6 grid grid-cols-4 gap-2 rounded-lg border border-border/40 p-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md shimmer-dark" />
          ))}
        </div>
        {/* Rows skeleton — matches RankingList rows */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/40 p-4">
              <div className="h-8 w-8 rounded-lg shimmer-dark" />
              <div className="h-20 w-14 rounded-lg shimmer-dark" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded shimmer-dark" />
                <div className="h-4 w-1/2 rounded shimmer-dark" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
