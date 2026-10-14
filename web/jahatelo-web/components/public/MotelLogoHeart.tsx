import { useId } from 'react';

type Props = { src: string; alt: string; className?: string };

export default function MotelLogoHeart({ src, alt, className = '' }: Props) {
  const clipId = useId();
  return (
    <span className={`block overflow-hidden rounded-full drop-shadow-md ${className}`} title={`${alt} · logo`}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Logo de ${alt}`} className="h-full w-full">
        <defs><clipPath id={clipId}><circle cx="50" cy="50" r="47" /></clipPath></defs>
        <circle cx="50" cy="50" r="47" fill="#090B12" />
        <image href={src} x="8" y="8" width="84" height="84" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
        <circle cx="50" cy="50" r="47" fill="none" stroke="white" strokeWidth="4" />
      </svg>
    </span>
  );
}