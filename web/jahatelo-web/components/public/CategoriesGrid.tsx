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

const cardStyles: Record<string, { bg: string; iconBg: string; iconColor: string; border: string }> = {
  'map-outline': {
    bg: 'bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    border: 'border border-purple-400/30',
  },
  'location-outline': {
    bg: 'bg-gradient-to-br from-purple-700/80 to-purple-900/80 hover:from-purple-600 hover:to-purple-800',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    border: 'border border-purple-500/30',
  },
  pricetag: {
    bg: 'bg-gradient-to-br from-pink-600/80 to-purple-700/80 hover:from-pink-500 hover:to-purple-600',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    border: 'border border-pink-400/30',
  },
};

export default function CategoriesGrid({ categories }: CategoriesGridProps) {
  const mapCategory = categories.find((cat) => cat.id === 'map');
  const otherCategories = categories.filter((cat) => cat.id !== 'map');

  return (
    <div className="space-y-3">
      {/* Botón de mapa horizontal */}
      {mapCategory && (
        <Link
          href={mapCategory.href}
          className={`animate-card-in-1 relative flex items-center justify-center gap-4 px-6 rounded-2xl h-20 shadow-lg hover:shadow-purple-900/50 hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden ${cardStyles['map-outline'].bg} ${cardStyles['map-outline'].border}`}
        >
          {/* shimmer sweep */}
          <div className="card-shimmer" />
          <div className={`w-12 h-12 ${cardStyles['map-outline'].iconBg} rounded-xl flex items-center justify-center ${cardStyles['map-outline'].iconColor} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            {icons[mapCategory.iconName] || icons['map-outline']}
          </div>
          <h3 className="text-lg font-bold text-white">{mapCategory.label}</h3>
          <svg className="w-5 h-5 text-white/60 absolute right-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      {/* Grid de otros botones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {otherCategories.map((category, i) => {
          const style = cardStyles[category.iconName] || cardStyles['location-outline'];
          const animClass = i === 0 ? 'animate-card-in-2' : 'animate-card-in-3';
          return (
            <Link
              key={category.id}
              href={category.href}
              className={`${animClass} relative flex items-center gap-4 px-6 rounded-2xl h-24 shadow-lg hover:shadow-purple-900/50 hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden ${style.bg} ${style.border}`}
            >
              {/* shimmer sweep */}
              <div className="card-shimmer" />
              <div className={`w-12 h-12 ${style.iconBg} rounded-xl flex items-center justify-center ${style.iconColor} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                {icons[category.iconName] || icons['location-outline']}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{category.label}</h3>
              </div>
              <svg className="w-5 h-5 text-white/60 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
