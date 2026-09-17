'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAdvertisements, trackAdEvent } from '@/hooks/useAdvertisements';
import type { Advertisement } from '@/hooks/useAdvertisements';
import { BLUR_DATA_URL } from '@/components/imagePlaceholders';
import { MOTEL_PATTERN_STYLE } from '@/components/public/motelPattern';
import type { PublicMotelListItem } from '@/lib/domain/motels/publicListItem';
import { getMotelPlanGlowTone, hasMotelPlanGlow } from '@/lib/domain/motels/planPresentation';
import MotelLogoHeart from '@/components/public/MotelLogoHeart';

type Motel = PublicMotelListItem;

interface FeaturedCarouselProps {
  featuredMotels: Motel[];
}


export default function FeaturedCarousel({ featuredMotels }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const { ads } = useAdvertisements('CAROUSEL');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const trackedAdViews = useRef<Set<string>>(new Set());
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const didDrag = useRef(false);
  const adPlaceholder = '/motel-placeholder.png';

  const mixedItems = useMemo(() => {
    if (!ads.length) {
      return featuredMotels.map((motel) => ({ type: 'motel' as const, data: motel }));
    }

    const result: Array<{ type: 'motel' | 'ad'; data: Motel | Advertisement }> = [];
    const itemsPerAd = 5;

    featuredMotels.forEach((motel, index) => {
      result.push({ type: 'motel', data: motel });
      if ((index + 1) % itemsPerAd === 0) {
        const adIndex = Math.floor(index / itemsPerAd) % ads.length;
        result.push({ type: 'ad', data: ads[adIndex] });
      }
    });

    // Siempre agregar al menos un ad si hay moteles, sin importar cuántos haya
    if (featuredMotels.length % itemsPerAd !== 0 && ads.length > 0) {
      const adIndex = Math.floor(featuredMotels.length / itemsPerAd) % ads.length;
      result.push({ type: 'ad', data: ads[adIndex] });
    }

    return result;
  }, [featuredMotels, ads]);

  useEffect(() => {
    // Rota siempre que exista más de una tarjeta visible.
    // Antes se frenaba con menos de 4 ítems, por eso el carrusel parecía roto
    // cuando producción tenía pocos destacados/publicidades cargadas.
    if (mixedItems.length < 2) return;
    if (isDragging) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mixedItems.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isDragging, mixedItems.length]);

  useEffect(() => {
    const currentItem = mixedItems[currentIndex];
    if (currentItem?.type === 'ad') {
      const ad = currentItem.data as Advertisement;
      if (!trackedAdViews.current.has(ad.id)) {
        trackedAdViews.current.add(ad.id);
        trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: 'CAROUSEL' });
      }
    }
  }, [currentIndex, mixedItems]);

  if (mixedItems.length === 0) return null;

  const goToIndex = (index: number) => {
    if (mixedItems.length === 0) return;
    setCurrentIndex((index + mixedItems.length) % mixedItems.length);
  };

  const goToPrevious = () => goToIndex(currentIndex - 1);
  const goToNext = () => goToIndex(currentIndex + 1);
  const handleDotClick = (index: number) => goToIndex(index);
  const getSlideState = (index: number) => {
    const previousIndex = (currentIndex - 1 + mixedItems.length) % mixedItems.length;
    const nextIndex = (currentIndex + 1) % mixedItems.length;

    if (index === currentIndex) {
      return {
        className: 'left-[8%] w-[84%] scale-100 opacity-100 z-20',
        active: true,
        interactive: true,
      };
    }

    if (mixedItems.length === 2 && index === nextIndex) {
      return {
        className: 'left-[43%] w-[72%] scale-[0.88] opacity-55 z-10',
        active: false,
        interactive: true,
      };
    }

    if (mixedItems.length > 2 && index === previousIndex) {
      return {
        className: 'left-[-15%] w-[72%] scale-[0.88] opacity-55 z-10',
        active: false,
        interactive: true,
      };
    }

    if (mixedItems.length > 2 && index === nextIndex) {
      return {
        className: 'left-[43%] w-[72%] scale-[0.88] opacity-55 z-10',
        active: false,
        interactive: true,
      };
    }

    return {
      className: 'left-[14%] w-[72%] scale-90 opacity-0 z-0',
      active: false,
      interactive: false,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    dragDeltaX.current = 0;
    didDrag.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = event.clientX - dragStartX.current;
    if (Math.abs(dragDeltaX.current) > 8) didDrag.current = true;
  };

  const finishDrag = () => {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    dragStartX.current = null;
    dragDeltaX.current = 0;
    window.setTimeout(() => {
      setIsDragging(false);
    }, 0);
    window.setTimeout(() => {
      didDrag.current = false;
    }, 160);

    if (Math.abs(delta) < 48) return;
    if (delta < 0) goToNext();
    else goToPrevious();
  };

  const preventClickAfterDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!didDrag.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleAdClick = (ad: Advertisement) => {
    setSelectedAd(ad);
    setShowAdModal(true);
    trackAdEvent({ advertisementId: ad.id, eventType: 'CLICK', source: 'CAROUSEL' });
  };

  return (
    <div className="w-full mb-8">
      <div
        className={`group relative h-64 overflow-hidden select-none md:h-80 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClickCapture={preventClickAfterDrag}
      >
        {mixedItems.map((item, index) => {
          const slideState = getSlideState(index);
          const isActive = slideState.active;
          const focusSlide = (event: React.MouseEvent<HTMLDivElement>) => {
            if (isActive) return;
            event.preventDefault();
            event.stopPropagation();
            goToIndex(index);
          };

          /* ── SLIDE DE PUBLICIDAD ── */
          if (item.type === 'ad') {
            const ad = item.data as Advertisement;
            const photoUrl = ad.imageUrl || adPlaceholder;

            return (
              <div
                key={`ad-${ad.id}`}
                className={`absolute top-0 h-full overflow-hidden rounded-2xl shadow-xl transition-all duration-700 ease-out ${slideState.className}`}
                onClickCapture={focusSlide}
                style={{ pointerEvents: slideState.interactive ? 'auto' : 'none' }}
              >
                <button
                  type="button"
                  onClick={() => handleAdClick(ad)}
                  className="absolute inset-0"
                >
                  <Image
                    src={photoUrl}
                    alt={ad.title}
                    fill
                    quality={85}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

                {/* Badge PUBLICIDAD — claramente distinguible del badge DESTACADO */}
                <div className="absolute top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg pointer-events-none">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-4.472 10.03l-.788 4.734a.75.75 0 001.095.79L10 15.65l4.165 1.904a.75.75 0 001.095-.79l-.788-4.734A6 6 0 0010 2z" />
                  </svg>
                  PUBLICIDAD
                </div>

                {/* Info del ad — botón, no Link de motel */}
                <button
                  type="button"
                  onClick={() => handleAdClick(ad)}
                  className="absolute bottom-0 left-0 right-0 p-6 text-white text-left"
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">{ad.title}</h3>
                  <p className="text-sm md:text-base text-amber-200">Ver más →</p>
                </button>
              </div>
            );
          }

          /* ── SLIDE DE MOTEL ── */
          const motel = item.data as Motel;
          const realPhotoUrl = motel.featuredPhotoWeb || motel.thumbnail || motel.featuredPhoto || null;
          const photoUrl = failedImages[motel.id] ? null : realPhotoUrl;
          const isPlaceholder = !photoUrl;
          const hasPlanGlow = hasMotelPlanGlow(motel.plan);
          const glowTone = getMotelPlanGlowTone(motel.plan);
          const glowStyle = {
            '--featured-glow-frame': glowTone === 'gold'
              ? 'conic-gradient(from 180deg at 50% 50%, rgba(245,158,11,0.95), rgba(253,230,138,0.95), rgba(217,119,6,0.95), rgba(251,191,36,0.95), rgba(245,158,11,0.95))'
              : 'conic-gradient(from 180deg at 50% 50%, rgba(34,211,238,0.9), rgba(186,230,253,0.9), rgba(14,116,144,0.9), rgba(125,211,252,0.9), rgba(34,211,238,0.9))',
            '--featured-orbit-shadow': glowTone === 'gold'
              ? '0 0 6px rgba(253, 230, 138, 0.7), 0 0 12px rgba(245, 158, 11, 0.45)'
              : '0 0 6px rgba(186, 230, 253, 0.7), 0 0 12px rgba(34, 211, 238, 0.45)',
          } as React.CSSProperties;

          return (
            <div
              key={motel.id}
              className={`absolute top-0 h-full overflow-hidden rounded-2xl shadow-xl transition-all duration-700 ease-out ${slideState.className}`}
              onClickCapture={focusSlide}
              style={{ pointerEvents: slideState.interactive ? 'auto' : 'none' }}
            >
              {isPlaceholder ? (
                <div className="absolute inset-0" style={MOTEL_PATTERN_STYLE} />
              ) : (
                <Link href={`/motels/${motel.slug}`} className="absolute inset-0">
                  <Image
                    src={photoUrl}
                    alt={motel.name}
                    fill
                    quality={85}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    priority={index === 0}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    onError={() => setFailedImages((prev) => ({ ...prev, [motel.id]: true }))}
                  />
                </Link>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

              {hasPlanGlow && (
                <div className="featured-plan-frame pointer-events-none absolute inset-0 rounded-2xl" style={glowStyle}>
                  <div className="featured-plan-orbit absolute inset-0 rounded-2xl">
                    <span className="featured-plan-dot" />
                  </div>
                  <div className="featured-plan-shimmer absolute -inset-1 rounded-2xl" />
                </div>
              )}

              {motel.logoUrl && <MotelLogoHeart src={motel.logoUrl} alt={motel.name} className="absolute left-4 top-4 h-14 w-16" />}

              {/* Badge DESTACADO */}
              <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg pointer-events-none">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                DESTACADO
              </div>

              {/* Info del motel — Link real al perfil */}
              <Link
                href={`/motels/${motel.slug}`}
                className="absolute bottom-0 left-0 right-0 p-6 text-white"
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-2">{motel.name}</h3>
                <p className="text-sm md:text-base text-purple-200">Ver detalles →</p>
              </Link>
            </div>
          );
        })}
        <style jsx>{`
          .featured-plan-frame::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 2px;
            background: var(--featured-glow-frame);
            -webkit-mask:
              linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
          }
          .featured-plan-orbit {
            animation: featured-plan-orbit 4.2s linear infinite;
          }
          .featured-plan-dot {
            position: absolute;
            top: 0;
            left: 50%;
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: var(--featured-orbit-shadow);
            transform: translate(-50%, -50%);
          }
          .featured-plan-shimmer {
            background: linear-gradient(
              120deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.18) 45%,
              rgba(255, 255, 255, 0) 70%
            );
            animation: featured-plan-shimmer 7s linear infinite;
            mix-blend-mode: screen;
          }
          @keyframes featured-plan-orbit {
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes featured-plan-shimmer {
            0% {
              opacity: 0;
              transform: translateX(-60%) rotate(20deg);
            }
            10% {
              opacity: 0.45;
            }
            50% {
              opacity: 0.2;
            }
            100% {
              opacity: 0;
              transform: translateX(60%) rotate(20deg);
            }
          }
        `}</style>
      </div>

      {mixedItems.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {mixedItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleDotClick(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? `w-8 ${item.type === 'ad' ? 'bg-amber-400' : 'bg-purple-500'}`
                  : 'w-2.5 bg-white/35 hover:bg-white/65'
              }`}
              aria-label={`Ir a ${item.type === 'ad' ? 'publicidad' : 'destacado'} ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Modal de publicidad */}
      {showAdModal && selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="relative h-64 bg-slate-100">
              <Image
                src={selectedAd.largeImageUrl || adPlaceholder}
                alt={selectedAd.title}
                fill
                quality={85}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <button
                onClick={() => setShowAdModal(false)}
                className="absolute top-3 right-3 bg-white/90 text-slate-700 rounded-full w-9 h-9 flex items-center justify-center hover:bg-white"
                aria-label="Cerrar anuncio"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Publicidad</p>
                <h3 className="text-lg font-semibold text-slate-900">{selectedAd.title}</h3>
                <p className="text-sm text-slate-500">{selectedAd.advertiser}</p>
              </div>
              {selectedAd.description && (
                <p className="text-sm text-slate-600">{selectedAd.description}</p>
              )}
              {selectedAd.linkUrl && (
                <a
                  href={selectedAd.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-amber-500 text-white rounded-lg py-2 font-semibold hover:bg-amber-600 transition"
                >
                  Visitar sitio
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
