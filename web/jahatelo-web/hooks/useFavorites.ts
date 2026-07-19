import { useState, useEffect, useCallback } from 'react';
import {
  getLocalFavorites,
  addLocalFavorite,
  removeLocalFavorite,
} from '@/lib/favoritesService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook personalizado para manejar favoritos
 * Soporta persistencia local para usuarios no autenticados
 * y sincronización con backend para usuarios autenticados
 */
export const useFavorites = (authenticatedOverride?: boolean) => {
  const auth = useAuth();
  const isAuthenticated = authenticatedOverride ?? auth.isAuthenticated;
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar favoritos al montar
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavoritesFromBackend();
    } else {
      setFavorites(getLocalFavorites());
    }
  }, [isAuthenticated]);

  // Obtener favoritos del backend
  const fetchFavoritesFromBackend = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mobile/favorites', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.motelIds || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agregar a favoritos
  const addFavorite = useCallback(
    async (motelId: string, _source: string = 'LIST') => {
      void _source;
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/mobile/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ motelId }),
          });

          if (response.ok) {
            setFavorites((prev) => [...prev, motelId]);
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error adding favorite:', error);
          return false;
        }
      } else {
        // Usuario no autenticado - usar localStorage
        addLocalFavorite(motelId);
        setFavorites((prev) => [...prev, motelId]);
        return true;
      }
    },
    [isAuthenticated]
  );

  // Remover de favoritos
  const removeFavorite = useCallback(
    async (motelId: string, _source: string = 'LIST') => {
      void _source;
      if (isAuthenticated) {
        try {
          const response = await fetch(`/api/mobile/favorites?motelId=${motelId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            setFavorites((prev) => prev.filter((id) => id !== motelId));
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error removing favorite:', error);
          return false;
        }
      } else {
        // Usuario no autenticado - usar localStorage
        removeLocalFavorite(motelId);
        setFavorites((prev) => prev.filter((id) => id !== motelId));
        return true;
      }
    },
    [isAuthenticated]
  );

  // Toggle favorito
  const toggleFavorite = useCallback(
    async (motelId: string, source: string = 'LIST') => {
      if (favorites.includes(motelId)) {
        return await removeFavorite(motelId, source);
      } else {
        return await addFavorite(motelId, source);
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  // Verificar si es favorito
  const isFavorite = useCallback(
    (motelId: string) => {
      return favorites.includes(motelId);
    },
    [favorites]
  );

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
};
