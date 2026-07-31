'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';

type Amenity = {
  id: string;
  name: string;
  icon: string | null;
};

/**
 * En web replica el gesto de la app: tocar cualquier icono abre el listado
 * completo de amenities. Así los iconos no dependen únicamente de un tooltip.
 */
export default function AmenityList({ amenities }: { amenities: Amenity[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const iconLibrary = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;

  if (amenities.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {amenities.map((amenity) => {
          const Icon = amenity.icon ? iconLibrary[amenity.icon] : undefined;
          return (
            <button
              key={amenity.id}
              type="button"
              onClick={() => setIsOpen(true)}
              title={`Ver amenities: ${amenity.name}`}
              aria-label={`Ver amenities: ${amenity.name}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600 transition-colors hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {Icon ? <Icon size={18} /> : <span className="text-base font-semibold">•</span>}
            </button>
          );
        })}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 sm:items-center sm:justify-center sm:p-4" role="presentation">
          <button
            type="button"
            aria-label="Cerrar amenities"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <section role="dialog" aria-modal="true" aria-labelledby="amenities-dialog-title" className="relative z-10 max-h-[78vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h4 id="amenities-dialog-title" className="text-lg font-bold text-slate-900">Amenities</h4>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <LucideIcons.X size={20} />
              </button>
            </div>
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto px-5">
              {amenities.map((amenity) => {
                const Icon = amenity.icon ? iconLibrary[amenity.icon] : undefined;
                return (
                  <li key={amenity.id} className="flex items-center gap-3 py-3.5 text-sm font-medium text-slate-700">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                      {Icon ? <Icon size={17} /> : <span className="font-semibold">•</span>}
                    </span>
                    {amenity.name}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
