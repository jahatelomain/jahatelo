'use client';

import FavoriteButton from '@/components/public/FavoriteButton';
import { useFavorites } from '@/hooks/useFavorites';

type FavoriteButtonClientProps = {
  motelId: string;
  source?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button';
};

export default function FavoriteButtonClient({
  motelId,
  source = 'DETAIL',
  size = 'medium',
  variant = 'icon',
}: FavoriteButtonClientProps) {
  const { isFavorite, toggleFavorite } = useFavorites(false);

  return (
    <FavoriteButton
      motelId={motelId}
      isFavorite={isFavorite(motelId)}
      onToggle={() => toggleFavorite(motelId, source)}
      source={source}
      size={size}
      variant={variant}
    />
  );
}
