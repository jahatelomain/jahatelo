'use client';

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationControlsProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
      <p className="text-sm text-slate-500">
        Mostrando {Math.min(totalItems, (page - 1) * pageSize + 1)}-
        {Math.min(totalItems, page * pageSize)} de {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
