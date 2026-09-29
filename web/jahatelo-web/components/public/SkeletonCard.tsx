export default function SkeletonCard() {
  return (
    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[360px] h-full flex flex-col animate-pulse">
      {/* Image placeholder */}
      <div className="relative h-40 bg-gray-200" />

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Title */}
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        {/* Location */}
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
        {/* Amenities */}
        <div className="flex gap-2 mt-auto">
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
        {/* Price */}
        <div className="pt-4 border-t border-gray-100">
          <div className="h-6 w-1/3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMobileRow() {
  return (
    <div className="md:hidden flex gap-3 border-b border-slate-100 py-3 animate-pulse">
      <div className="h-24 w-24 shrink-0 bg-gray-200 rounded-2xl" />
      <div className="min-w-0 flex-1 py-0.5 flex flex-col gap-2">
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
        <div className="flex gap-1.5 mt-auto">
          <div className="h-6 w-6 bg-gray-200 rounded-full" />
          <div className="h-6 w-6 bg-gray-200 rounded-full" />
          <div className="h-6 w-6 bg-gray-200 rounded-full" />
        </div>
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}