import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@jahatelo/favorites';

const FavoritesContext = createContext({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  loadFavorites: () => {},
});

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar favoritos desde AsyncStorage al iniciar
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
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
  const toggleFavorite = (motel) => {
    if (!motel || !motel.id) {
      console.warn('toggleFavorite: motel inválido');
      return;
    }

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
        };
        newFavorites = [...prevFavorites, favoriteItem];
      }

      // Guardar automáticamente
      saveFavorites(newFavorites);

      return newFavorites;
    });
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
