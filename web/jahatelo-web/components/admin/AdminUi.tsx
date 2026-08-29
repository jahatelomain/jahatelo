import type { ReactNode } from 'react';

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-2 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {label}
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-1 block text-sm text-red-600" role="alert">{error}</span> : hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function AdminTableShell({ children, emptyMessage }: { children?: ReactNode; emptyMessage?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {children || <div className="px-6 py-12 text-center text-sm text-slate-500">{emptyMessage || 'No hay resultados.'}</div>}
    </div>
  );
}
