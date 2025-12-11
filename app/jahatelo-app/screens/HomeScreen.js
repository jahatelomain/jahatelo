import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchFeaturedMotels, fetchMotels } from '../services/motelsApi';
import MotelCard from '../components/MotelCard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [motels, setMotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadMotels = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      // Intentar primero con moteles destacados
      let data = await fetchFeaturedMotels();

      // Si no hay destacados, cargar todos
      if (!data || data.length === 0) {
        data = await fetchMotels();
      }

      setMotels(data);
    } catch (err) {
      console.error('Error al cargar moteles:', err);
      setError(err.message || 'Error al cargar moteles');
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadMotels();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMotels(true);
  };

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id, // Mantener compatibilidad
    });
  };

  const renderMotelCard = ({ item }) => (
    <MotelCard
      motel={item}
      onPress={() => handleMotelPress(item)}
    />
  );

  // Mostrar loading inicial
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF2E93" />
        <Text style={styles.loadingText}>Cargando moteles...</Text>
      </View>
    );
  }

  // Mostrar error
  if (error && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Text style={styles.errorHint}>Verifica tu conexión a internet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={motels}
        renderItem={renderMotelCard}
        keyExtractor={item => item.slug || item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF2E93']}
            tintColor="#FF2E93"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay moteles disponibles</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF2E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
