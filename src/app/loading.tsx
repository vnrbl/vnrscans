export default function RootLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
        {/* Hero skeleton */}
        <div className="mb-8 flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[300px] w-[210px] shrink-0 rounded-xl shimmer-dark" />
          ))}
        </div>
        {/* Section skeleton */}
        <div className="mb-8 space-y-4">
          <div className="h-7 w-56 rounded shimmer-dark" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card rounded-lg p-3">
                <div className="flex gap-3">
                  <div className="h-[160px] w-[125px] rounded-lg shimmer-dark" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 rounded shimmer-dark" />
                    <div className="h-6 w-full rounded shimmer-dark" />
                    <div className="h-6 w-full rounded shimmer-dark" />
                    <div className="h-6 w-full rounded shimmer-dark" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
