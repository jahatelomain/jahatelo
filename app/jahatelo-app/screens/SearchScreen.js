import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { searchAndFilterMotels } from '../services/motelsApi';
import MotelCard from '../components/MotelCard';

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

  // Función para cargar resultados
  const loadResults = async (query, amenity) => {
    try {
      setLoading(true);
      setError(null);
      const data = await searchAndFilterMotels(query, amenity);
      setResults(data);
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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, barrio o ciudad..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
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

        <FlatList
          data={results}
          renderItem={renderMotelCard}
          keyExtractor={item => item.slug || item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#CCC" />
                <Text style={styles.emptyTitle}>No se encontraron moteles</Text>
                <Text style={styles.emptyText}>
                  Intenta con otros términos de búsqueda o filtros
                </Text>
              </View>
            )
          }
        />
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
