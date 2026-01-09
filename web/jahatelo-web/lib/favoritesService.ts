/**
 * Favorites Service
 * Servicio para manejar favoritos con persistencia local y sincronización con backend
 */

const FAVORITES_KEY = 'jahatelo_favorites';

/**
 * Obtiene favoritos del localStorage
 */
export const getLocalFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error);
    return [];
  }
};

/**
 * Guarda favoritos en localStorage
 */
export const saveLocalFavorites = (favorites: string[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
};

/**
 * Agrega un motel a favoritos locales
 */
export const addLocalFavorite = (motelId: string): void => {
  const favorites = getLocalFavorites();
  if (!favorites.includes(motelId)) {
    favorites.push(motelId);
    saveLocalFavorites(favorites);
  }
};

/**
 * Remueve un motel de favoritos locales
 */
export const removeLocalFavorite = (motelId: string): void => {
  const favorites = getLocalFavorites();
  const filtered = favorites.filter((id) => id !== motelId);
  saveLocalFavorites(filtered);
};

/**
 * Verifica si un motel está en favoritos locales
 */
export const isLocalFavorite = (motelId: string): boolean => {
  const favorites = getLocalFavorites();
  return favorites.includes(motelId);
};

/**
 * Limpia favoritos locales (usado después de sincronizar con backend)
 */
export const clearLocalFavorites = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAVORITES_KEY);
};

/**
 * Sincroniza favoritos locales con el backend (cuando el usuario se autentica)
 */
export const syncFavoritesWithBackend = async (): Promise<void> => {
  const localFavorites = getLocalFavorites();

  if (localFavorites.length === 0) return;

  try {
    // Agregar cada favorito local al backend
    for (const motelId of localFavorites) {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motelId }),
      });
    }

    // Limpiar localStorage después de sincronizar
    clearLocalFavorites();
  } catch (error) {
    console.error('Error syncing favorites with backend:', error);
  }
};
