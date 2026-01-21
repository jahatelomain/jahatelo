'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

export default function LazyImage(props: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      <Image
        {...props}
        quality={props.quality ?? 85}
        onLoad={(event) => {
          setLoaded(true);
          props.onLoad?.(event);
        }}
      />
    </div>
  );
}
