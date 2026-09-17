'use client';

import FavoriteButton from '@/components/public/FavoriteButton';
import { useCallback, useEffect, useState } from 'react';
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
  const { addFavorite, isFavorite, removeFavorite } = useFavorites();
  const serverFavorite = isFavorite(motelId);
  const [favorite, setFavorite] = useState(serverFavorite);

  useEffect(() => {
    setFavorite(serverFavorite);
  }, [serverFavorite]);

  const handleToggle = useCallback(async () => {
    const previousValue = favorite;
    setFavorite(!previousValue);

    const success = previousValue
      ? await removeFavorite(motelId, source)
      : await addFavorite(motelId, source);
    if (!success) {
      setFavorite(previousValue);
    }
    return success;
  }, [addFavorite, favorite, motelId, removeFavorite, source]);

  return (
    <FavoriteButton
      motelId={motelId}
      isFavorite={favorite}
      onToggle={handleToggle}
      source={source}
      size={size}
      variant={variant}
    />
  );
}
