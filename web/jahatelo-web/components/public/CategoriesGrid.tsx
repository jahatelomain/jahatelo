'use client';

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
const icons: { [key: string]: JSX.Element } = {
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
          className="block bg-white border-2 border-purple-600 rounded-2xl p-6 hover:bg-purple-50 transition-all duration-300 shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                {icons[mapCategory.iconName] || icons['map-outline']}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{mapCategory.label}</h3>
                <p className="text-gray-600 text-sm">Explora moteles en el mapa interactivo</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Grid de otros botones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {otherCategories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="bg-white border-2 border-purple-600 rounded-2xl p-6 hover:bg-purple-50 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                {icons[category.iconName] || icons['location-outline']}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {category.label}
                </h3>
              </div>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
