import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { playFavoriteSound } from '../services/soundService';

const STORAGE_KEY = '@jahatelo/favorites';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000';

const FavoritesContext = createContext({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  loadFavorites: () => {},
});

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { isAuthenticated, token, user } = useAuth();

  // Cargar favoritos cuando cambia el estado de autenticación
  useEffect(() => {
    loadFavorites();
  }, [isAuthenticated]);

  // Sincronizar favoritos locales a la nube cuando el usuario inicia sesión
  useEffect(() => {
    if (isAuthenticated && isLoaded && favorites.length > 0) {
      syncLocalToCloud();
    }
  }, [isAuthenticated, isLoaded]);

  const loadFavorites = async () => {
    try {
      // Si está autenticado, cargar desde la API
      if (isAuthenticated && token) {
        try {
          const response = await fetch(`${API_URL}/api/mobile/favorites`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            // data.favorites es array de objetos con toda la info del motel
            setFavorites(data.favorites || []);
            // Guardar también en local storage como backup
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.favorites || []));
            setIsLoaded(true);
            return;
          }
        } catch (apiError) {
          console.warn('Error al cargar favoritos desde API, usando local:', apiError);
          // Continuar con carga local si falla la API
        }
      }

      // Fallback: cargar desde AsyncStorage (modo invitado o si falló la API)
      const storedFavorites = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedFavorites !== null) {
        const parsedFavorites = JSON.parse(storedFavorites);

        // Migración: convertir formato viejo (array de strings) a nuevo (array de objetos)
        if (parsedFavorites.length > 0 && typeof parsedFavorites[0] === 'string') {
          // Formato viejo detectado, convertir a objetos
          const migratedFavorites = parsedFavorites.map(id => ({ id }));
          setFavorites(migratedFavorites);
          // Guardar en el nuevo formato
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedFavorites));
        } else {
          // Formato nuevo, usar directamente
          setFavorites(parsedFavorites);
        }
      }
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  // Sincronizar favoritos locales a la nube cuando el usuario inicia sesión
  const syncLocalToCloud = async () => {
    if (!isAuthenticated || !token) return;

    try {
      const storedFavorites = await AsyncStorage.getItem(STORAGE_KEY);
      if (!storedFavorites) return;

      const localFavorites = JSON.parse(storedFavorites);
      if (localFavorites.length === 0) return;

      // Obtener favoritos actuales de la nube
      const response = await fetch(`${API_URL}/api/mobile/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const { favorites: cloudFavorites } = await response.json();
      const cloudMotelIds = new Set(cloudFavorites.map(f => f.id));

      // Subir favoritos locales que no están en la nube
      for (const favorite of localFavorites) {
        if (!cloudMotelIds.has(favorite.id)) {
          try {
            await fetch(`${API_URL}/api/mobile/favorites`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ motelId: favorite.id }),
            });
          } catch (error) {
            console.error('Error al sincronizar favorito:', favorite.id, error);
          }
        }
      }

      // Recargar favoritos desde la nube después de sincronizar
      await loadFavorites();
    } catch (error) {
      console.error('Error al sincronizar favoritos:', error);
    }
  };

  // Guardar favoritos en AsyncStorage
  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error al guardar favoritos:', error);
    }
  };

  // Verificar si un motel es favorito
  const isFavorite = (motelId) => {
    return favorites.some(item => item.id === motelId);
  };

  // Agregar o quitar de favoritos
  const toggleFavorite = async (motel) => {
    if (!motel || !motel.id) {
      console.warn('toggleFavorite: motel inválido');
      return;
    }

    const existingIndex = favorites.findIndex(item => item.id === motel.id);
    const isRemoving = existingIndex !== -1;

    // Si está autenticado, usar API
    if (isAuthenticated && token) {
      try {
        if (isRemoving) {
          // Quitar de favoritos en la nube
          const response = await fetch(`${API_URL}/api/mobile/favorites?motelId=${motel.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            // Actualizar estado local
            const newFavorites = favorites.filter(item => item.id !== motel.id);
            setFavorites(newFavorites);
            await saveFavorites(newFavorites);
            playFavoriteSound('remove');
          } else {
            console.error('Error al quitar favorito de la API');
          }
        } else {
          // Agregar a favoritos en la nube
          const response = await fetch(`${API_URL}/api/mobile/favorites`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ motelId: motel.id }),
          });

          if (response.ok) {
            const data = await response.json();
            // Crear objeto favorito con datos para tarjeta
            const favoriteItem = {
              id: motel.id,
              slug: motel.slug,
              nombre: motel.nombre,
              barrio: motel.barrio,
              ciudad: motel.ciudad,
              precioDesde: motel.precioDesde,
              amenities: motel.amenities || [],
              rating: motel.rating,
              tienePromo: motel.tienePromo || false,
              isFeatured: motel.isFeatured || false,
              thumbnail: motel.thumbnail || null,
              photos: motel.photos || [],
              distanciaKm: motel.distanciaKm || null,
              plan: motel.plan || 'BASIC',
            };
            const newFavorites = [...favorites, favoriteItem];
            setFavorites(newFavorites);
            await saveFavorites(newFavorites);
            playFavoriteSound('add');
          } else {
            console.error('Error al agregar favorito a la API');
          }
        }
      } catch (error) {
        console.error('Error al comunicarse con la API de favoritos:', error);
        // Fallback: actualizar solo localmente si falla la API
        toggleFavoriteLocal(motel);
      }
    } else {
      // Modo invitado: solo actualizar localmente
      toggleFavoriteLocal(motel, isRemoving);
    }
  };

  // Función auxiliar para actualizar favoritos localmente
  const toggleFavoriteLocal = (motel, isRemovingOverride) => {
    const isRemoving = typeof isRemovingOverride === 'boolean'
      ? isRemovingOverride
      : favorites.some(item => item.id === motel.id);
    setFavorites((prevFavorites) => {
      let newFavorites;

      const existingIndex = prevFavorites.findIndex(item => item.id === motel.id);

      if (existingIndex !== -1) {
        // Quitar de favoritos
        newFavorites = prevFavorites.filter(item => item.id !== motel.id);
      } else {
        // Agregar a favoritos - guardar objeto con datos para tarjeta
        const favoriteItem = {
          id: motel.id,
          slug: motel.slug,
          nombre: motel.nombre,
          barrio: motel.barrio,
          ciudad: motel.ciudad,
          precioDesde: motel.precioDesde,
          amenities: motel.amenities || [],
          rating: motel.rating,
          tienePromo: motel.tienePromo || false,
          isFeatured: motel.isFeatured || false,
          thumbnail: motel.thumbnail || null,
          photos: motel.photos || [],
          distanciaKm: motel.distanciaKm || null,
          plan: motel.plan || 'BASIC',
        };
        newFavorites = [...prevFavorites, favoriteItem];
      }

      // Guardar automáticamente
      saveFavorites(newFavorites);

      return newFavorites;
    });
    playFavoriteSound(isRemoving ? 'remove' : 'add');
  };

  const value = {
    favorites,
    isFavorite,
    toggleFavorite,
    loadFavorites,
    isLoaded,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Hook personalizado para usar el contexto de favoritos
export const useFavorites = () => {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites debe usarse dentro de un FavoritesProvider');
  }

  return context;
};
