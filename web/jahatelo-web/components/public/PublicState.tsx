import type { ReactNode } from 'react';

type PublicStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  kind?: 'loading' | 'empty' | 'error';
  className?: string;
};

export default function PublicState({
  title,
  description,
  icon,
  action,
  kind = 'empty',
  className = '',
}: PublicStateProps) {
  const liveRole = kind === 'error' ? 'alert' : 'status';

  return (
    <section
      className={`public-card mx-auto flex w-full max-w-lg flex-col items-center px-6 py-10 text-center ${className}`}
      role={liveRole}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
      aria-busy={kind === 'loading' || undefined}
    >
      {icon || (kind === 'loading' && <span className="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-r-purple-600" aria-hidden="true" />)}
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
