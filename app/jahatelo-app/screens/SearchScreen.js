import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
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
import { getApiRoot } from '../services/apiBaseUrl';
import MotelCard from '../components/MotelCard';
import MotelCardSkeleton from '../components/MotelCardSkeleton';
import AdListItem from '../components/AdListItem';
import AdDetailModal from '../components/AdDetailModal';
import { prefetchMotelDetails, prefetchThumbnails } from '../services/prefetchService';
import { useAdvertisements } from '../hooks/useAdvertisements';
import { mixAdvertisements } from '../utils/mixAdvertisements';

// Filtros rápidos por amenities comunes
const QUICK_FILTERS = [
  'Jacuzzi',
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdDetailModal, setShowAdDetailModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const debounceTimerRef = useRef(null);
  const suggestionsTimerRef = useRef(null);
  const resultsAbortRef = useRef(null);
  const suggestionsAbortRef = useRef(null);

  // Cargar anuncios de lista
  const { ads: listAds, trackAdEvent } = useAdvertisements('LIST_INLINE');

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
    resultsAbortRef.current?.abort();
    const controller = new AbortController();
    resultsAbortRef.current = controller;
    try {
      setLoading(true);
      setError(null);
      const data = await searchAndFilterMotels(query, amenity, { signal: controller.signal });
      if (controller.signal.aborted) return;
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
      if (err?.name === 'AbortError') return;
      console.error('Error al buscar moteles:', err);
      setError(err.message || 'Error al buscar');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadResults(searchQuery, selectedAmenity);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, selectedAmenity]);

  useEffect(() => {
    if (route?.params?.initialQuery !== undefined) {
      setSearchQuery(route.params.initialQuery);
    }
  }, [route?.params?.initialQuery]);

  // Fetch de sugerencias con debounce de 300ms
  useEffect(() => {
    if (suggestionsTimerRef.current) clearTimeout(suggestionsTimerRef.current);
    if (!isFocused || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestionsTimerRef.current = setTimeout(async () => {
      suggestionsAbortRef.current?.abort();
      const controller = new AbortController();
      suggestionsAbortRef.current = controller;
      try {
        const base = getApiRoot().replace('/api/mobile', '');
        const res = await fetch(`${base}/api/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions((data.suggestions || []).length > 0);
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
        // ignorar errores de suggestions
      }
    }, 300);
    return () => {
      if (suggestionsTimerRef.current) clearTimeout(suggestionsTimerRef.current);
      suggestionsAbortRef.current?.abort();
    };
  }, [searchQuery, isFocused]);

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
      resultsAbortRef.current?.abort();
    };
  }, [searchQuery, selectedAmenity]);

  // Mezclar resultados con anuncios
  const mixedItems = useMemo(() => {
    return mixAdvertisements(results, listAds);
  }, [results, listAds]);

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id, // Mantener compatibilidad
    });
  };

  const handleAdClick = (ad) => {
    if (!ad) return;
    trackAdEvent(ad.id, 'CLICK');
    setSelectedAd(ad);
    setShowAdDetailModal(true);
  };

  const handleAdView = (ad) => {
    if (!ad) return;
    trackAdEvent(ad.id, 'VIEW');
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

  const handleSuggestionPress = useCallback((suggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);
    if (suggestion.type === 'motel' && suggestion.slug) {
      navigation.navigate('MotelDetail', { motelSlug: suggestion.slug });
    } else {
      setSearchQuery(suggestion.label);
    }
  }, [navigation]);

  // Handlers de focus/blur para animación
  const handleSearchFocus = () => {
    setIsFocused(true);
    searchBarScale.value = withSpring(1.02, { damping: 15 });
    searchBarBorderWidth.value = withTiming(2, { duration: 250 });
    searchBarShadowRadius.value = withTiming(8, { duration: 250 });
  };

  const handleSearchBlur = () => {
    setIsFocused(false);
    // Pequeño delay para permitir el press en sugerencias antes de cerrar
    setTimeout(() => setShowSuggestions(false), 150);
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

  const renderItem = ({ item }) => {
    if (item.type === 'ad') {
      return (
        <AdListItem
          ad={item.data}
          onAdClick={handleAdClick}
          onAdView={handleAdView}
        />
      );
    }

    return (
      <MotelCard
        motel={item.data}
        onPress={() => handleMotelPress(item.data)}
      />
    );
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedAmenity !== '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <Animated.View style={[styles.searchBar, animatedSearchBarStyle]}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o ciudad..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Dropdown de sugerencias */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((s, index) => (
              <TouchableOpacity
                key={`${s.type}-${s.label}-${index}`}
                style={[styles.suggestionItem, index < suggestions.length - 1 && styles.suggestionItemBorder]}
                onPress={() => handleSuggestionPress(s)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={s.type === 'motel' ? 'business-outline' : s.type === 'city' ? 'location-outline' : 'map-outline'}
                  size={16}
                  color="#888"
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionLabel}>{s.label}</Text>
                  {s.subtitle ? <Text style={styles.suggestionSubtitle}>{s.subtitle}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
            data={mixedItems}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.type}-${item.data.id || item.data.slug || index}`}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF2E93']} />}
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

      {/* Modal de detalle de anuncio */}
      <AdDetailModal
        visible={showAdDetailModal}
        ad={selectedAd}
        onClose={() => {
          setShowAdDetailModal(false);
          setSelectedAd(null);
        }}
        onTrackClick={(adId) => trackAdEvent(adId, 'CLICK')}
      />
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
    zIndex: 10,
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
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionLabel: {
    fontSize: 14,
    color: '#2A0038',
    fontWeight: '500',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
});
