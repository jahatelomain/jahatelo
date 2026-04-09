import type { ReactNode } from 'react';

export default function SectionWrapper({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`section-bg ${className}`}>
      {/* Partículas idénticas al hero */}
      <div className="section-particles">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
