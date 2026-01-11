'use client';

import type { ReactElement } from 'react';

import Link from 'next/link';

interface Category {
  id: string;
  label: string;
  href: string;
  iconName: string;
  isHorizontal?: boolean;
}

interface CategoriesGridProps {
  categories: Category[];
}

// Patrones de fondo SVG (iguales a la app)
const CitiesPattern = () => (
  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="citiesPattern" patternUnits="userSpaceOnUse" width="120" height="120">
        <rect width="120" height="120" fill="#1a0a2e" />
        {/* Edificios con diferentes alturas */}
        <rect x="5" y="70" width="15" height="50" fill="#3d1f5c" opacity="0.75" />
        <rect x="5" y="68" width="15" height="2" fill="#5a3380" opacity="0.75" />
        <rect x="25" y="50" width="18" height="70" fill="#3d1f5c" opacity="0.75" />
        <rect x="25" y="48" width="18" height="2" fill="#5a3380" opacity="0.75" />
        <rect x="48" y="60" width="14" height="60" fill="#3d1f5c" opacity="0.75" />
        <rect x="48" y="58" width="14" height="2" fill="#5a3380" opacity="0.75" />
        <rect x="67" y="45" width="20" height="75" fill="#3d1f5c" opacity="0.75" />
        <rect x="67" y="43" width="20" height="2" fill="#5a3380" opacity="0.75" />
        <rect x="92" y="65" width="16" height="55" fill="#3d1f5c" opacity="0.75" />
        <rect x="92" y="63" width="16" height="2" fill="#5a3380" opacity="0.75" />
        {/* Ventanas pequeñas */}
        <rect x="8" y="75" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <rect x="14" y="75" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <rect x="8" y="85" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <rect x="14" y="85" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <rect x="30" y="55" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <rect x="37" y="55" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <rect x="30" y="65" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <rect x="37" y="65" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#citiesPattern)" />
  </svg>
);

const MapPattern = () => (
  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="mapPattern" patternUnits="userSpaceOnUse" width="100" height="100">
        <rect width="100" height="100" fill="#0a1a2e" />
        {/* Líneas de contorno topográficas curvas */}
        <path d="M0,20 Q25,18 50,20 T100,20" stroke="#1e4d6b" strokeWidth="1.5" fill="none" opacity="0.75" />
        <path d="M0,35 Q25,33 50,35 T100,35" stroke="#1e4d6b" strokeWidth="1.5" fill="none" opacity="0.75" />
        <path d="M0,50 Q25,48 50,50 T100,50" stroke="#2a6f8f" strokeWidth="2" fill="none" opacity="0.75" />
        <path d="M0,65 Q25,63 50,65 T100,65" stroke="#1e4d6b" strokeWidth="1.5" fill="none" opacity="0.75" />
        <path d="M0,80 Q25,78 50,80 T100,80" stroke="#1e4d6b" strokeWidth="1.5" fill="none" opacity="0.75" />
        {/* Puntos de marcadores */}
        <circle cx="20" cy="35" r="2.5" fill="#3a8fb7" opacity="0.75" />
        <circle cx="50" cy="50" r="3" fill="#3a8fb7" opacity="0.8" />
        <circle cx="75" cy="65" r="2.5" fill="#3a8fb7" opacity="0.75" />
        {/* Líneas de grilla sutiles */}
        <line x1="33" y1="0" x2="33" y2="100" stroke="#1e4d6b" strokeWidth="0.5" opacity="0.5" />
        <line x1="66" y1="0" x2="66" y2="100" stroke="#1e4d6b" strokeWidth="0.5" opacity="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#mapPattern)" />
  </svg>
);

const PromoPattern = () => (
  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="promoPattern" patternUnits="userSpaceOnUse" width="120" height="120">
        <rect width="120" height="120" fill="#2b0f2f" />
        {/* Etiquetas inclinadas */}
        <rect x="5" y="15" width="40" height="12" rx="6" fill="#6b1f7a" opacity="0.8" />
        <rect x="60" y="10" width="45" height="12" rx="6" fill="#8b2fb0" opacity="0.8" />
        <rect x="15" y="55" width="50" height="12" rx="6" fill="#6b1f7a" opacity="0.8" />
        <rect x="70" y="65" width="40" height="12" rx="6" fill="#8b2fb0" opacity="0.8" />
        {/* Círculos de descuento */}
        <circle cx="25" cy="95" r="9" fill="#a855f7" opacity="0.7" />
        <circle cx="85" cy="95" r="7" fill="#f59e0b" opacity="0.7" />
        {/* Líneas diagonales suaves */}
        <line x1="0" y1="35" x2="120" y2="25" stroke="#3f1647" strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="85" x2="120" y2="75" stroke="#3f1647" strokeWidth="1" opacity="0.6" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#promoPattern)" />
  </svg>
);

// Mapeo de patrones por categoría
const patterns: Record<string, ReactElement> = {
  'location-outline': <CitiesPattern />,
  'map-outline': <MapPattern />,
  pricetag: <PromoPattern />,
};

// Mapeo de iconos SVG
const icons: Record<string, ReactElement> = {
  'location-outline': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'map-outline': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  'flame-outline': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  pricetag: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h5l7 7-5 5-7-7V7z" />
      <circle cx="9.5" cy="9.5" r="1.5" />
    </svg>
  ),
};

export default function CategoriesGrid({ categories }: CategoriesGridProps) {
  const mapCategory = categories.find((cat) => cat.id === 'map');
  const otherCategories = categories.filter((cat) => cat.id !== 'map');

  return (
    <div className="space-y-4">
      {/* Botón de mapa horizontal */}
      {mapCategory && (
        <Link
          href={mapCategory.href}
          className="relative block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group h-20"
        >
          {/* Patrón de fondo */}
          {patterns[mapCategory.iconName]}

          {/* Contenido */}
          <div className="relative flex items-center justify-center h-full px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center text-white border-2 border-white/40">
                {icons[mapCategory.iconName] || icons['map-outline']}
              </div>
              <h3 className="text-lg font-bold text-white drop-shadow-md">{mapCategory.label}</h3>
            </div>
          </div>
        </Link>
      )}

      {/* Grid de otros botones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {otherCategories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="relative block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group h-40"
          >
            {/* Patrón de fondo */}
            {patterns[category.iconName]}

            {/* Contenido */}
            <div className="relative flex flex-col items-center justify-center h-full px-6 py-8">
              <div className="w-14 h-14 bg-white/25 rounded-xl flex items-center justify-center text-white border-2 border-white/40 mb-3">
                {icons[category.iconName] || icons['location-outline']}
              </div>
              <h3 className="text-base font-bold text-white text-center drop-shadow-md">
                {category.label}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
