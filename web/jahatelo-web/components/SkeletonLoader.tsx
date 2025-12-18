export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-slate-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-slate-200 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-slate-100 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 rounded animate-pulse w-1/3" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="space-y-3">
            <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
            <div className="h-8 bg-slate-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 rounded animate-pulse w-1/4 mb-6" />
        <div>
          <div className="h-4 bg-slate-100 rounded animate-pulse w-1/5 mb-2" />
          <div className="h-10 bg-slate-50 rounded animate-pulse" />
        </div>
        <div>
          <div className="h-4 bg-slate-100 rounded animate-pulse w-1/5 mb-2" />
          <div className="h-10 bg-slate-50 rounded animate-pulse" />
        </div>
        <div>
          <div className="h-4 bg-slate-100 rounded animate-pulse w-1/5 mb-2" />
          <div className="h-24 bg-slate-50 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 pt-4">
          <div className="flex-1 h-10 bg-slate-200 rounded animate-pulse" />
          <div className="w-24 h-10 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-48" />
          <div className="h-4 bg-slate-100 rounded animate-pulse w-64" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
      </div>

      {/* Content */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 rounded animate-pulse" />
          <div className="h-8 bg-slate-50 rounded animate-pulse w-3/4" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}

export function SpinnerOverlay({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function InlineSpinner({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-purple-600 ${sizes[size]}`} />
  );
}
