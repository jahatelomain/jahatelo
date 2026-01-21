import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { searchAndFilterMotels } from '../services/motelsApi';
import MotelCard from '../components/MotelCard';
import MotelCardSkeleton from '../components/MotelCardSkeleton';
import { prefetchMotelDetails, prefetchThumbnails } from '../services/prefetchService';

// Filtros rápidos por amenities comunes
const QUICK_FILTERS = [
  'Jacuzzi',
  'Garage privado',
  'Room service',
  'WiFi gratis',
  'A/C',
];

export default function SearchScreen({ route }) {
  const navigation = useNavigation();
  const initialQuery = route?.params?.initialQuery ?? '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedAmenity, setSelectedAmenity] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceTimerRef = useRef(null);

  // Valores animados para SearchBar
  const searchBarScale = useSharedValue(1);
  const searchBarBorderWidth = useSharedValue(1);
  const searchBarShadowRadius = useSharedValue(4);

  // Animación para empty state icon
  const emptyIconScale = useSharedValue(1);
  const emptyIconOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Pulsating search icon animation
    emptyIconScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      false
    );

    emptyIconOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 })
      ),
      -1,
      false
    );
  }, []);

  // Función para cargar resultados
  const loadResults = async (query, amenity) => {
    try {
      setLoading(true);
      setError(null);
      const data = await searchAndFilterMotels(query, amenity);
      setResults(data);

      // Prefetch de los primeros 5 resultados en background
      if (data && data.length > 0) {
        setTimeout(() => {
          const topResults = data.slice(0, 5);
          prefetchMotelDetails(topResults);
          prefetchThumbnails(topResults);
        }, 300);
      }
    } catch (err) {
      console.error('Error al buscar moteles:', err);
      setError(err.message || 'Error al buscar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route?.params?.initialQuery !== undefined) {
      setSearchQuery(route.params.initialQuery);
    }
  }, [route?.params?.initialQuery]);

  // Effect con debounce para búsqueda
  useEffect(() => {
    // Cancelar timer anterior si existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Configurar nuevo timer con debounce de 500ms
    debounceTimerRef.current = setTimeout(() => {
      loadResults(searchQuery, selectedAmenity);
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, selectedAmenity]);

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id, // Mantener compatibilidad
    });
  };

  const handleAmenityPress = (amenity) => {
    // Si ya está seleccionado, deseleccionar; sino, seleccionar
    if (selectedAmenity === amenity) {
      setSelectedAmenity('');
    } else {
      setSelectedAmenity(amenity);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAmenity('');
  };

  // Handlers de focus/blur para animación
  const handleSearchFocus = () => {
    searchBarScale.value = withSpring(1.02, { damping: 15 });
    searchBarBorderWidth.value = withTiming(2, { duration: 250 });
    searchBarShadowRadius.value = withTiming(8, { duration: 250 });
  };

  const handleSearchBlur = () => {
    searchBarScale.value = withSpring(1, { damping: 15 });
    searchBarBorderWidth.value = withTiming(1, { duration: 250 });
    searchBarShadowRadius.value = withTiming(4, { duration: 250 });
  };

  // Estilo animado para SearchBar
  const animatedSearchBarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: searchBarScale.value }],
      borderWidth: searchBarBorderWidth.value,
      borderColor: searchBarBorderWidth.value > 1 ? '#FF2E93' : '#E0E0E0',
      shadowRadius: searchBarShadowRadius.value,
      shadowOpacity: searchBarShadowRadius.value > 4 ? 0.15 : 0.05,
    };
  });

  // Estilo animado para empty state icon
  const animatedEmptyIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: emptyIconScale.value }],
      opacity: emptyIconOpacity.value,
    };
  });

  // Prefetch al hacer scroll
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      // Obtener índice del último item visible
      const lastVisibleIndex = Math.max(...viewableItems.map(item => item.index || 0));

      // Prefetch los próximos 3 items
      const nextItems = results.slice(lastVisibleIndex + 1, lastVisibleIndex + 4);
      if (nextItems.length > 0) {
        setTimeout(() => {
          prefetchMotelDetails(nextItems);
          prefetchThumbnails(nextItems);
        }, 100);
      }
    }
  }).current;

  const renderMotelCard = ({ item }) => (
    <MotelCard
      motel={item}
      onPress={() => handleMotelPress(item)}
    />
  );

  const hasActiveFilters = searchQuery.trim() !== '' || selectedAmenity !== '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <Animated.View style={[styles.searchBar, animatedSearchBarStyle]}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, barrio o ciudad..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Filtros rápidos por amenity */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {QUICK_FILTERS.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[
                styles.filterChip,
                selectedAmenity === amenity && styles.filterChipActive,
              ]}
              onPress={() => handleAmenityPress(amenity)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedAmenity === amenity && styles.filterChipTextActive,
                ]}
              >
                {amenity}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Botón para limpiar filtros */}
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearFilters}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Resultados */}
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
          </Text>
          {loading && <ActivityIndicator size="small" color="#FF2E93" />}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.listContent}>
            {Array.from({ length: 6 }).map((_, index) => (
              <MotelCardSkeleton key={`search-skeleton-${index}`} />
            ))}
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderMotelCard}
            keyExtractor={item => item.slug || item.id}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig.current}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Animated.View style={animatedEmptyIconStyle}>
                  <Ionicons name="search-outline" size={64} color="#CCC" />
                </Animated.View>
                <Text style={styles.emptyTitle}>No se encontraron moteles</Text>
                <Text style={styles.emptyText}>
                  Intenta con otros términos de búsqueda o filtros
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    backgroundColor: '#F0E6F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F0E6F6',
  },
  filterChipActive: {
    backgroundColor: '#FF2E93',
    borderColor: '#FF2E93',
  },
  filterChipText: {
    fontSize: 14,
    color: '#2A0038',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF2E93',
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF2E93',
  },
  errorBannerText: {
    fontSize: 14,
    color: '#856404',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
