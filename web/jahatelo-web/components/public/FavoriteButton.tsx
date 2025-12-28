'use client';

import { useState, useEffect } from 'react';

interface Motel {
  id: string;
  name: string;
  slug: string;
}

interface FavoriteButtonProps {
  motel: Motel;
}

export default function FavoriteButton({ motel }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Load favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem('jahatelo_favorites') || '[]');
    setIsFavorite(favorites.some((fav: Motel) => fav.id === motel.id));
  }, [motel.id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('jahatelo_favorites') || '[]');

    if (isFavorite) {
      // Remove from favorites
      const newFavorites = favorites.filter((fav: Motel) => fav.id !== motel.id);
      localStorage.setItem('jahatelo_favorites', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      // Add to favorites
      const newFavorites = [...favorites, { id: motel.id, name: motel.name, slug: motel.slug }];
      localStorage.setItem('jahatelo_favorites', JSON.stringify(newFavorites));
      setIsFavorite(true);
    }

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all ${
        isAnimating ? 'scale-125' : 'scale-100'
      }`}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      {isFavorite ? (
        <svg className="w-6 h-6 text-purple-600 fill-current" viewBox="0 0 20 20">
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
}
