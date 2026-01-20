import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MotelCard from '../components/MotelCard';
import AdListItem from '../components/AdListItem';
import AdDetailModal from '../components/AdDetailModal';
import { useAdvertisements } from '../hooks/useAdvertisements';
import { mixAdvertisements } from '../utils/mixAdvertisements';
import { COLORS } from '../constants/theme';
import { fetchMotels } from '../services/motelsApi';
import MotelCardSkeleton from '../components/MotelCardSkeleton';

export default function CityMotelsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { cityName, motels = [] } = route.params;
  const headerPaddingTop = insets.top + 12;
  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdDetailModal, setShowAdDetailModal] = useState(false);
  const [cityMotels, setCityMotels] = useState(motels);
  const [loading, setLoading] = useState(motels.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadMotels = async () => {
      if (motels.length > 0) {
        setCityMotels(motels);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchMotels({ city: cityName });
        if (mounted) {
          setCityMotels(data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err?.message || 'Error al cargar moteles');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMotels();

    return () => {
      mounted = false;
    };
  }, [cityName, motels]);

  // Cargar anuncios de lista
  const { ads: listAds, loading: adsLoading, trackAdEvent } = useAdvertisements('LIST_INLINE');

  // Mezclar moteles con anuncios
  const mixedItems = useMemo(() => {
    if (loading || adsLoading) {
      return cityMotels.map((motel) => ({ type: 'motel', data: motel }));
    }
    return mixAdvertisements(cityMotels, listAds);
  }, [cityMotels, listAds, loading, adsLoading]);

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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header personalizado */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{cityName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.subtitle}>Cargando moteles...</Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>
            {cityMotels.length} {cityMotels.length === 1 ? 'motel encontrado' : 'moteles encontrados'}
          </Text>
        )}
        {error && !loading && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {loading ? (
          <View style={styles.listContent}>
            {Array.from({ length: 6 }).map((_, index) => (
              <MotelCardSkeleton key={`motel-skeleton-${index}`} />
            ))}
          </View>
        ) : (
          <FlatList
            data={mixedItems}
            keyExtractor={(item, index) => `${item.type}-${item.data.id || index}`}
            renderItem={({ item }) => {
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
                  onPress={() => navigation.navigate('MotelDetail', { motelId: item.data.id })}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={64} color={COLORS.muted} />
                <Text style={styles.emptyText}>
                  {error ? 'No pudimos cargar los moteles' : 'No hay moteles en esta ciudad'}
                </Text>
              </View>
            }
          />
        )}
      </View>

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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 8,
    color: COLORS.error,
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
});
