type SkeletonVariant = 'table' | 'cards' | 'detail';

type AdminPageSkeletonProps = {
 variant?: SkeletonVariant;
 rows?: number;
 cards?: number;
 className?: string;
};

function TableSkeleton({ rows }: { rows: number }) {
 return (
 <div className="space-y-4">
 <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
 <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
 {Array.from({ length: rows }).map((_, i) => (
 <div key={i} className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0">
 <div className="h-4 w-8 animate-pulse rounded bg-slate-200" />
 <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
 <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
 <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
 </div>
 ))}
 </div>
 </div>
 );
}

function CardsSkeleton({ count }: { count: number }) {
 return (
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
 {Array.from({ length: count }).map((_, i) => (
 <div
 key={i}
 className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
 >
 <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
 <div className="mt-4 h-8 w-1/2 animate-pulse rounded bg-slate-200" />
 <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-slate-200" />
 </div>
 ))}
 </div>
 );
}

function DetailSkeleton() {
 return (
 <div className="space-y-6">
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-2">
 <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
 <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
 </div>
 <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
 </div>
 <div className="grid gap-6 lg:grid-cols-3">
 <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="flex items-center gap-4">
 <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
 <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
 </div>
 ))}
 </div>
 <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-slate-200" />
 ))}
 </div>
 </div>
 </div>
 );
}

export default function AdminPageSkeleton({
 variant = 'table',
 rows = 5,
 cards = 6,
 className = '',
}: AdminPageSkeletonProps) {
 const containerClass = className ? ` ${className}` : '';

 return (
 <div className={`min-h-[60vh] p-4 md:p-8${containerClass}`}>
 <div className="mb-6 space-y-2">
 <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
 <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
 <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
 </div>
 {variant === 'table' && <TableSkeleton rows={rows} />}
 {variant === 'cards' && <CardsSkeleton count={cards} />}
 {variant === 'detail' && <DetailSkeleton />}
 </div>
 );
}