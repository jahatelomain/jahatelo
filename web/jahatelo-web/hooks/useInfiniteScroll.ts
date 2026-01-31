import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

/**
 * Hook para implementar infinite scroll
 * @param loading - Si está cargando datos actualmente
 * @param hasMore - Si hay más datos para cargar
 * @param onLoadMore - Callback para cargar más datos
 * @param threshold - Distancia en px desde el final para activar carga (default: 200)
 */
export function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  threshold = 200,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current || loading || !hasMore) return;

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loading && hasMore) {
        onLoadMore();
      }
    }, options);

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, onLoadMore, threshold]);

  return { sentinelRef };
}
