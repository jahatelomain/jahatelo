'use client';

import { useId } from 'react';

const heartPath = 'M50 91C45 86 10 62 10 34C10 18 22 8 37 8C45 8 52 12 57 19C62 12 69 8 77 8C92 8 104 18 104 34C104 62 69 86 64 91C60 95 54 95 50 91Z';

type Props = { src: string; alt: string; className?: string };

export default function MotelLogoHeart({ src, alt, className = '' }: Props) {
  const clipId = `motel-logo-${useId().replace(/:/g, '')}`;

  return (
    <span className={`block drop-shadow-md ${className}`} title={`${alt} · logo`}>
      <svg viewBox="0 0 114 100" role="img" aria-label={`Logo de ${alt}`} className="h-full w-full">
        <defs><clipPath id={clipId}><path d={heartPath} /></clipPath></defs>
        <path d={heartPath} fill="#090B12" />
        <image href={src} x="13" y="12" width="88" height="76" preserveAspectRatio="xMidYMid meet" clipPath={`url(#${clipId})`} />
        <path d={heartPath} fill="none" stroke="white" strokeWidth="4" />
      </svg>
    </span>
  );
}
