import { SeriesCardSkeleton } from "@/components/SeriesCard";

export default function BrowseLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
        {/* Toolbar skeleton */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="h-10 w-64 rounded-lg shimmer-dark" />
          <div className="h-10 w-36 rounded-lg shimmer-dark" />
          <div className="h-10 w-36 rounded-lg shimmer-dark" />
        </div>
        {/* Card grid skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <SeriesCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
