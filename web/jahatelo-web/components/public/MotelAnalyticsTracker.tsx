'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { trackMapClick, trackMotelView, trackWebsiteClick } from '@/lib/analyticsService';

export function MotelDetailViewTracker({ motelId }: { motelId: string }) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void trackMotelView(motelId, 'DETAIL');
  }, [motelId]);
  return null;
}

export function TrackedMotelLink({ motelId, kind, href, children, className }: { motelId: string; kind: 'map' | 'website'; href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => { if (kind === 'map') void trackMapClick(motelId, 'DETAIL'); else void trackWebsiteClick(motelId, 'DETAIL'); }}>{children}</a>;
}
