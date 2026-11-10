/** Skeleton del carousel de moteles destacados en el hero desktop. */
export function FeaturedCarouselSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shrink-0 w-72 h-48 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton de la grilla de categorías en el hero desktop. */
export function CategoriesGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-xl" />
      ))}
    </div>
  );
}

/** Skeleton de la sección de ciudades en el hero desktop. */
export function CityListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-10 w-48 bg-purple-900/30 rounded" />
        <div className="h-px flex-1 bg-purple-700/30" />
        <div className="h-5 w-20 bg-purple-900/30 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-12 bg-purple-900/20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton de la sección de promos en el hero desktop. */
export function PromoListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-10 w-48 bg-pink-900/30 rounded" />
        <div className="h-px flex-1 bg-pink-700/30" />
        <div className="h-5 w-20 bg-pink-900/30 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-pink-900/20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}