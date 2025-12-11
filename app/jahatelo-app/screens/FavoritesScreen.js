import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../hooks/useFavorites';
import { fetchMotelBySlug } from '../services/motelsApi';
import MotelCard from '../components/MotelCard';

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { favorites, toggleFavorite } = useFavorites();
  const [favoriteMotels, setFavoriteMotels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos completos de favoritos si faltan campos
  useEffect(() => {
    const loadFavoritesData = async () => {
      // Verificar si hay favoritos que necesitan completarse (migrados del formato viejo)
      const needsCompletion = favorites.some(fav => !fav.nombre || !fav.slug);

      if (needsCompletion) {
        setLoading(true);
        try {
          // Cargar datos completos para favoritos que solo tienen ID
          const promises = favorites.map(async (fav) => {
            if (!fav.nombre || !fav.slug) {
              // Este favorito viene del formato viejo, completar datos
              try {
                const fullData = await fetchMotelBySlug(fav.id);
                // Actualizar el contexto con datos completos
                toggleFavorite(fullData); // Esto reemplazará el objeto incompleto
                return fullData;
              } catch (err) {
                console.error(`Error al completar favorito ${fav.id}:`, err);
                return fav; // Mantener el favorito incompleto si falla
              }
            }
            return fav;
          });

          const completedFavorites = await Promise.all(promises);
          setFavoriteMotels(completedFavorites.filter(m => m !== null));
        } catch (err) {
          console.error('Error al completar favoritos:', err);
          setFavoriteMotels(favorites);
        } finally {
          setLoading(false);
        }
      } else {
        // Favoritos ya tienen datos completos
        setFavoriteMotels(favorites);
      }
    };

    loadFavoritesData();
  }, [favorites]);

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug || motel.id,
      motelId: motel.id, // Mantener compatibilidad
    });
  };

  const renderMotelCard = ({ item }) => (
    <MotelCard
      motel={item}
      onPress={() => handleMotelPress(item)}
    />
  );

  // Mostrar loading mientras completa favoritos
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF2E93" />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mostrar mensaje cuando no hay favoritos
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Sin favoritos aún</Text>
          <Text style={styles.emptyText}>
            Todavía no agregaste moteles a favoritos.{'\n'}
            Tocá el corazón en cualquier motel para guardarlo aquí.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Favoritos</Text>
        <Text style={styles.headerSubtitle}>
          {favorites.length} {favorites.length === 1 ? 'motel' : 'moteles'}
        </Text>
      </View>

      <FlatList
        data={favoriteMotels}
        renderItem={renderMotelCard}
        keyExtractor={item => item.slug || item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A0038',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});
