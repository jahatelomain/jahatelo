import React, { useMemo, useEffect, useState } from 'react';
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
import Animated, {
  FadeIn,
  FadeInRight,
  SlideInLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/theme';
import { fetchCities } from '../services/motelsApi';
import { useAdvertisements } from '../hooks/useAdvertisements';
import { mixAdvertisements } from '../utils/mixAdvertisements';
import AdDetailModal from '../components/AdDetailModal';

// Componente de city card animada
const AnimatedCityCard = ({ item, index, onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(500).springify()}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress(item);
        }}
        activeOpacity={1}
      >
        <Animated.View style={[styles.cityCard, animatedStyle]}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.cityInfo}>
            <Text style={styles.cityName}>{item.name}</Text>
            <Text style={styles.cityCount}>
              {item.count} {item.count === 1 ? 'motel' : 'moteles'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedCityAdCard = ({ item, index, onPress }) => {
  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(500).springify()}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={1}
      >
        <Animated.View style={[styles.cityCard, styles.adCityCard]}>
          <View style={[styles.iconContainer, styles.adIconContainer]}>
            <Ionicons name="megaphone" size={26} color="#D97706" />
          </View>
          <View style={styles.cityInfo}>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>PUBLICIDAD</Text>
            </View>
            <Text style={[styles.cityName, styles.adTitle]} numberOfLines={1}>{item.title}</Text>
            {item.advertiser ? (
              <Text style={[styles.cityCount, styles.adSubtitle]} numberOfLines={1}>{item.advertiser}</Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Empty state animado
const AnimatedEmptyState = () => {
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    );

    iconRotation.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1000 }),
        withTiming(10, { duration: 2000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={animatedIconStyle}>
        <Ionicons name="earth-outline" size={64} color={COLORS.muted} />
      </Animated.View>
      <Text style={styles.emptyText}>No hay ciudades disponibles</Text>
    </View>
  );
};

const CityCardSkeleton = ({ index }) => (
  <Animated.View entering={FadeInRight.delay(index * 80).duration(500).springify()}>
    <View style={styles.cityCardSkeleton}>
      <View style={styles.iconSkeleton} />
      <View style={styles.textSkeleton}>
        <View style={styles.lineSkeleton} />
        <View style={styles.lineSkeletonShort} />
      </View>
    </View>
  </Animated.View>
);

export default function CitySelectorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { motels = [] } = route.params || {};
  const mode = route?.params?.mode || 'motels';
  const useProvidedMotels = route?.params?.useProvidedMotels || mode === 'promos';
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdDetailModal, setShowAdDetailModal] = useState(false);
  const { ads: listAds, loading: adsLoading, trackAdEvent } = useAdvertisements('LIST_INLINE');

  useEffect(() => {
    let mounted = true;

    const loadCities = async () => {
      if (useProvidedMotels) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchCities();
        if (mounted) {
          setCities(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err?.message || 'Error al cargar ciudades');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCities();

    return () => {
      mounted = false;
    };
  }, []);

  // Agrupar moteles por ciudad
  const citiesData = useMemo(() => {
    if (cities.length > 0) {
      return cities
        .map((city) => ({
          name: city.name,
          count: city.count || 0,
          motels: [],
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    if (motels.length === 0) return [];

    const citiesMap = {};

    motels.forEach((motel) => {
      const city = motel.ciudad || motel.city || 'Sin ciudad';
      if (!citiesMap[city]) {
        citiesMap[city] = [];
      }
      citiesMap[city].push(motel);
    });

    return Object.keys(citiesMap)
      .sort()
      .map((cityName) => ({
        name: cityName,
        count: citiesMap[cityName].length,
        motels: citiesMap[cityName],
      }));
  }, [cities, motels]);

  const mixedItems = useMemo(() => {
    if (loading || adsLoading) {
      return citiesData.map((city) => ({ type: 'motel', data: city }));
    }
    return mixAdvertisements(citiesData, listAds);
  }, [citiesData, listAds, loading, adsLoading]);

  const normalizeCityName = (value) => {
    return (value || '').toString().trim().toLowerCase();
  };

  const handleCityPress = (city) => {
    if (mode === 'promos' && useProvidedMotels) {
      const cityKey = normalizeCityName(city.name);
      const filteredMotels = motels.filter((motel) => (
        normalizeCityName(motel.ciudad || motel.city) === cityKey
      ));

      navigation.navigate('MotelList', {
        title: `Promos en ${city.name}`,
        motels: filteredMotels,
        listType: 'promos',
      });
      return;
    }

    navigation.navigate('CityMotels', {
      cityName: city.name,
      motels: city.motels,
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

  const headerPaddingTop = insets.top + 12;
  const headerTitle = mode === 'promos' ? 'Promos por ciudad' : 'Moteles por ciudad';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header personalizado con animación */}
      <Animated.View
        entering={SlideInLeft.duration(400).springify()}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Contenido */}
      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(200).duration(500)}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.subtitle}>Cargando ciudades...</Text>
            </View>
          ) : (
            <Text style={styles.subtitle}>
              {citiesData.length} {citiesData.length === 1 ? 'ciudad disponible' : 'ciudades disponibles'}
            </Text>
          )}
          {error && !loading && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </Animated.View>

        {loading ? (
          <View style={styles.listContent}>
            {Array.from({ length: 6 }).map((_, index) => (
              <CityCardSkeleton key={`city-skeleton-${index}`} index={index} />
            ))}
          </View>
        ) : (
          <FlatList
            data={mixedItems}
            keyExtractor={(item, index) => `${item.type}-${item.data?.name || item.data?.id || index}`}
            renderItem={({ item, index }) => {
              if (item.type === 'ad') {
                return (
                  <AnimatedCityAdCard
                    item={item.data}
                    index={index}
                    onPress={handleAdClick}
                  />
                );
              }

              return (
                <AnimatedCityCard
                  item={item.data}
                  index={index}
                  onPress={handleCityPress}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<AnimatedEmptyState />}
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
    backgroundColor: COLORS.background,
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
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    marginTop: 6,
    color: COLORS.error,
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  adCityCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  cityCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
  },
  iconSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    marginRight: 12,
  },
  textSkeleton: {
    flex: 1,
    gap: 8,
  },
  lineSkeleton: {
    height: 12,
    width: '60%',
    borderRadius: 6,
    backgroundColor: COLORS.card,
  },
  lineSkeletonShort: {
    height: 10,
    width: '40%',
    borderRadius: 6,
    backgroundColor: COLORS.card,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adIconContainer: {
    backgroundColor: '#FFF3DB',
  },
  cityInfo: {
    flex: 1,
  },
  adBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE5B4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  adTitle: {
    color: '#2A0038',
    fontWeight: '700',
  },
  cityCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  adSubtitle: {
    color: '#888',
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
