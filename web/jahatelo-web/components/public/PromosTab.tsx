'use client';

import Image from 'next/image';

interface Promo {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isGlobal?: boolean;
  validFrom?: Date | null;
  validUntil?: Date | null;
}

interface PromosTabProps {
  promos: Promo[];
}

export default function PromosTab({ promos }: PromosTabProps) {
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
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
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
              <p className="text-xs text-gray-500">
                Vigente{' '}
                {promo.validFrom && `desde ${new Date(promo.validFrom).toLocaleDateString('es-PY')}`}
                {promo.validUntil && ` hasta ${new Date(promo.validUntil).toLocaleDateString('es-PY')}`}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
