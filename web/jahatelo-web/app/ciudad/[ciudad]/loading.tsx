import SkeletonCard, { SkeletonMobileRow } from '@/components/public/SkeletonCard';

export default function CityLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-12 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-5 hidden md:block md:mb-12 animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded mb-4" />
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <SkeletonCard />
              <SkeletonMobileRow />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}