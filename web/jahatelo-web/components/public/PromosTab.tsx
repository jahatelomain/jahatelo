'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/components/imagePlaceholders';
import { getOrCreateDeviceId } from '@/lib/analytics';

interface Promo {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isGlobal?: boolean;
  validFrom?: Date | null;
  validUntil?: Date | null;
  hasPromoCode?: boolean;
}

interface PromosTabProps {
  promos: Promo[];
}

interface ClaimResult {
  code: string;
  promoTitle: string;
  promoDescription: string | null;
  promoImageUrl: string | null;
}

export default function PromosTab({ promos }: PromosTabProps) {
  const [claimedCodes, setClaimedCodes] = useState<Record<string, ClaimResult>>({});
  const [claimLoading, setClaimLoading] = useState<Record<string, boolean>>({});
  const [claimError, setClaimError] = useState<Record<string, string>>({});

  const handleClaim = async (promoId: string) => {
    setClaimLoading((prev) => ({ ...prev, [promoId]: true }));
    setClaimError((prev) => ({ ...prev, [promoId]: '' }));
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`/api/public/promos/${promoId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setClaimedCodes((prev) => ({ ...prev, [promoId]: data }));
      } else {
        setClaimError((prev) => ({ ...prev, [promoId]: data.error || 'Error al obtener código' }));
      }
    } catch {
      setClaimError((prev) => ({ ...prev, [promoId]: 'Error de conexión, intentá nuevamente' }));
    } finally {
      setClaimLoading((prev) => ({ ...prev, [promoId]: false }));
    }
  };

  if (!promos || promos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Sin promociones activas
        </h3>
        <p className="text-gray-600">
          Cuando este motel publique una promo, la vas a ver acá.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {promos.map((promo) => (
        <div key={promo.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {promo.imageUrl ? (
            <div className="relative h-40 bg-gray-200">
              <Image
                src={promo.imageUrl}
                alt={promo.title}
                fill
                quality={85}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>
          ) : (
            <div className="h-40 bg-purple-50 flex items-center justify-center">
              <p className="text-purple-600 font-bold text-lg">Promo</p>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-bold text-gray-900 flex-1">
                {promo.title}
              </h4>
              {promo.isGlobal && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-600 ml-2">
                  Home
                </span>
              )}
            </div>

            {promo.description ? (
              <p className="text-gray-700 mb-3">{promo.description}</p>
            ) : (
              <p className="text-gray-400 italic mb-3">Sin descripción</p>
            )}

            {(promo.validFrom || promo.validUntil) && (
              <p className="text-xs text-gray-500 mb-3">
                Vigente{' '}
                {promo.validFrom && `desde ${new Date(promo.validFrom).toLocaleDateString('es-PY')}`}
                {promo.validUntil && ` hasta ${new Date(promo.validUntil).toLocaleDateString('es-PY')}`}
              </p>
            )}

            {/* PromoCode claim */}
            {promo.hasPromoCode && (
              <div className="mt-2">
                {claimedCodes[promo.id] ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-purple-600 font-medium mb-1">Tu código promocional</p>
                    <p className="text-3xl font-bold font-mono tracking-widest text-purple-800 mb-2">
                      {claimedCodes[promo.id].code}
                    </p>
                    <p className="text-xs text-gray-600">Presentá este código en recepción</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleClaim(promo.id)}
                      disabled={claimLoading[promo.id]}
                      className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 disabled:opacity-60 transition-colors"
                    >
                      {claimLoading[promo.id] ? 'Generando...' : 'Obtener mi código'}
                    </button>
                    {claimError[promo.id] && (
                      <p className="mt-2 text-xs text-red-600 text-center">{claimError[promo.id]}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
