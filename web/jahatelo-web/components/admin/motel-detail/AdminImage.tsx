'use client';

import Image from 'next/image';
import { useState } from 'react';

const FALLBACK_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8"%3EImagen no disponible%3C/text%3E%3C/svg%3E';

type Props = {
  src: string;
  alt: string;
  className: string;
  width?: number;
  height?: number;
};

export default function AdminImage({ src, alt, className, width = 800, height = 450 }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentSrc = !src || failedSrc === src ? FALLBACK_IMAGE : src;

  return (
    <Image
      unoptimized
      src={currentSrc || FALLBACK_IMAGE}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
