'use client';

import { useState } from 'react';

interface FavoriteButtonProps {
  motelId: string;
  isFavorite: boolean;
  onToggle: () => Promise<boolean>;
  source?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button';
}

export default function FavoriteButton({
  motelId,
  isFavorite,
  onToggle,
  source = 'LIST',
  size = 'medium',
  variant = 'icon',
}: FavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    const success = await onToggle();

    if (success) {
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      setIsAnimating(false);
    }

    setIsLoading(false);
  };

  // Tamaños
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${
            isFavorite
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isAnimating ? 'scale-95' : 'scale-100'}
        `}
      >
        <svg
          className={`${iconSizes[size]} transition-transform ${
            isAnimating ? 'scale-125' : 'scale-100'
          }`}
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isFavorite ? 0 : 2}
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
        <span>{isFavorite ? 'En Favoritos' : 'Agregar a Favoritos'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className={`
        ${sizes[size]}
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        ${
          isFavorite
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isAnimating ? 'scale-110' : 'scale-100'}
        shadow-md hover:shadow-lg
      `}
    >
      <svg
        className={`${iconSizes[size]} transition-all ${
          isAnimating ? 'scale-125' : 'scale-100'
        }`}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={isFavorite ? 0 : 2}
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    </button>
  );
}
