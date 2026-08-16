type Props = { src: string; alt: string; className?: string; scale?: number | null };

export default function MotelLogoHeart({ src, alt, className = '', scale = 1 }: Props) {
  const normalizedScale = Math.min(1, Math.max(0.6, scale ?? 1));
  const imageSize = 84 * normalizedScale;
  const imageOffset = 50 - imageSize / 2;
  return (
    <span className={`block drop-shadow-md ${className}`} title={`${alt} · logo`}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Logo de ${alt}`} className="h-full w-full">
        <defs><clipPath id="motel-logo-circle"><circle cx="50" cy="50" r="47" /></clipPath></defs>
        <circle cx="50" cy="50" r="47" fill="#090B12" />
        <image href={src} x={imageOffset} y={imageOffset} width={imageSize} height={imageSize} preserveAspectRatio="xMidYMid meet" clipPath="url(#motel-logo-circle)" />
        <circle cx="50" cy="50" r="47" fill="none" stroke="white" strokeWidth="4" />
      </svg>
    </span>
  );
}
