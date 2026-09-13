import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from '../utils/reanimatedCompat';
import { useEffect } from 'react';
import MotelCard from '../components/MotelCard';
import AdListItem from '../components/AdListItem';
import AdDetailModal from '../components/AdDetailModal';
import { useAdvertisements } from '../hooks/useAdvertisements';
import { mixAdvertisements } from '../utils/mixAdvertisements';
import { COLORS } from '../constants/theme';
import { filterMotelsByDistance } from '../utils/location';
import { showMessage } from '../utils/appFeedback';

const PROMO_RADIUS_OPTIONS = [
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: null, label: 'Todos' },
  { value: 'PROMOS_BY_CITY', label: 'Ver promos por ciudad' },
];

const PROMO_LOCATION_TIMEOUT_MS = 8000;

const withTimeout = (promise, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });

// Componente wrapper para cada card con animación de entrada escalonada
const AnimatedMotelCard = ({ item, index, onPress }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
      <MotelCard motel={item} onPress={() => onPress(item)} />
    </Animated.View>
  );
};

const AnimatedPromoCard = ({ item, index, onPress }) => {
  const fallbackPattern = require('../assets/motel-placeholder.png');
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = item?.promoImageUrl || item?.thumbnail || item?.photos?.[0] || null;
  const resolvedUrl = imageFailed ? null : imageUrl;
  const imageSource = resolvedUrl ? { uri: resolvedUrl } : fallbackPattern;
  const isPlaceholder = !resolvedUrl;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item)} accessibilityRole="button" accessibilityLabel={`Ver ${item.nombre || item.name || 'motel'}`}>
        <ImageBackground
          source={imageSource}
          style={styles.promoCard}
          imageStyle={[styles.promoImage, isPlaceholder && styles.placeholderImage]}
          onError={() => setImageFailed(true)}
        >
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>PROMO</Text>
          </View>
          <View style={styles.promoOverlay}>
            <Text style={styles.promoTitle} numberOfLines={2}>
              {item?.promoTitle || 'Promoción especial'}
            </Text>
            <Text style={styles.promoMotelName} numberOfLines={2}>
              {item?.nombre}
            </Text>
            {item?.promoDescription ? (
              <Text style={styles.promoDescription} numberOfLines={2}>
                {item.promoDescription}
              </Text>
            ) : null}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente wrapper para anuncios con animación
const AnimatedAdListItem = ({ item, index, onAdClick, onAdView }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
      <AdListItem ad={item} onAdClick={onAdClick} onAdView={onAdView} />
    </Animated.View>
  );
};

// Componente de empty state animado
const AnimatedEmptyState = () => {
  const iconScale = useSharedValue(1);
  const iconOpacity = useSharedValue(0.5);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      false
    );

    iconOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(iconScale);
      cancelAnimation(iconOpacity);
    };
  }, [iconOpacity, iconScale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={animatedIconStyle}>
        <Ionicons name="list-outline" size={64} color={COLORS.muted} />
      </Animated.View>
      <Text style={styles.emptyText}>No hay moteles en esta categoría</Text>
    </View>
  );
};

export default function MotelListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { title, motels = [], listType } = route.params;
  const isPromosList = listType === 'promos';
  const headerPaddingTop = insets.top + 12;
  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdDetailModal, setShowAdDetailModal] = useState(false);
  // Las promos cercanas parten vacías: no mostramos resultados fuera del radio
  // mientras Android todavía está resolviendo la ubicación.
  const [displayMotels, setDisplayMotels] = useState(isPromosList ? [] : motels);
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isResolvingPromoLocation, setIsResolvingPromoLocation] = useState(isPromosList);

  // Cargar anuncios de lista
  const { ads: listAds, trackAdEvent } = useAdvertisements('LIST_INLINE');

  useEffect(() => {
    if (!isPromosList) {
      setDisplayMotels(motels);
    }
  }, [isPromosList, motels]);

  useEffect(() => {
    if (!isPromosList) return;
    loadPromoNearby();
  }, [isPromosList, motels]);

  useEffect(() => {
    if (!isPromosList) return;
    if (selectedRadius === 'PROMOS_BY_CITY') return;
    if (!userLocation && selectedRadius !== null) return;
    applyPromoRadius(selectedRadius);
  }, [selectedRadius, userLocation, motels]);

  const loadPromoNearby = async () => {
    let resolvedWithRecentLocation = false;
    setIsResolvingPromoLocation(true);
    setDisplayMotels([]);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showMessage(
          'Ubicación requerida',
          'Para ver promos cerca tuyo necesitamos acceso a tu ubicación. Puedes elegir "Todos".'
        );
        setSelectedRadius(null);
        setDisplayMotels(motels);
        setIsResolvingPromoLocation(false);
        return;
      }

      // Android puede tardar decenas de segundos en obtener un GPS nuevo. Una
      // ubicación reciente permite aplicar el filtro de inmediato y luego se
      // reemplaza silenciosamente por la lectura actual.
      const recentLocation = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 2000,
      });

      if (recentLocation?.coords) {
        resolvedWithRecentLocation = true;
        const recentCoords = {
          latitude: recentLocation.coords.latitude,
          longitude: recentLocation.coords.longitude,
        };
        setUserLocation(recentCoords);
        applyPromoRadius(selectedRadius, recentCoords, motels);
        setIsResolvingPromoLocation(false);
      }

      const location = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        PROMO_LOCATION_TIMEOUT_MS
      );
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      applyPromoRadius(selectedRadius, { latitude, longitude }, motels);
      setIsResolvingPromoLocation(false);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      // Si ya filtramos con una ubicación reciente, conservamos ese resultado.
      // Si no había ninguna, no exponemos promos fuera del radio por defecto.
      setIsResolvingPromoLocation(false);
      if (!resolvedWithRecentLocation) {
        showMessage(
          'No pudimos obtener tu ubicación',
          'Intenta nuevamente o selecciona "Todos" para ver todas las promociones.'
        );
      }
    }
  };

  const applyPromoRadius = (radius, location = userLocation, list = motels) => {
    if (radius === null) {
      setDisplayMotels(list);
      return;
    }

    if (!location) return;

    const filtered = filterMotelsByDistance(
      list,
      location.latitude,
      location.longitude,
      radius
    );
    setDisplayMotels(filtered);
  };

  // Mezclar moteles con anuncios
  const mixedItems = useMemo(() => {
    const baseMotels = isPromosList ? displayMotels : motels;
    return mixAdvertisements(baseMotels, listAds);
  }, [motels, displayMotels, listAds, isPromosList]);

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
      initialTab: isPromosList ? 'Promos' : undefined,
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
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Contenido */}
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.delay(200).duration(500)}
          style={[styles.infoRow, isPromosList && styles.infoRowPromos]}
        >
          <Text style={styles.subtitle}>
            {(isPromosList ? displayMotels.length : motels.length)} {((isPromosList ? displayMotels.length : motels.length) === 1) ? 'motel encontrado' : 'moteles encontrados'}
          </Text>
          {isPromosList && (
            <TouchableOpacity
              style={styles.locationBadge}
              onPress={() => setShowRadiusModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar distancia, actual ${selectedRadius} kilómetros`}
            >
              <Ionicons name="navigate" size={12} color={COLORS.primary} />
              <Text style={styles.locationText}>
                Radio: {selectedRadius === null ? 'Todos' : `${selectedRadius} km`}
              </Text>
              <Ionicons name="chevron-down" size={12} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {isResolvingPromoLocation ? (
          <View style={styles.locationLoading} accessibilityRole="progressbar">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.locationLoadingText}>Buscando promociones cerca tuyo...</Text>
          </View>
        ) : (
        <FlatList
          data={mixedItems}
          keyExtractor={(item, index) => `${item.type}-${item.data.id || item.data.slug || index}`}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          renderItem={({ item, index }) => {
            if (item.type === 'ad') {
              return (
                <AnimatedAdListItem
                  item={item.data}
                  index={index}
                  onAdClick={handleAdClick}
                  onAdView={handleAdView}
                />
              );
            }

            if (isPromosList) {
              return (
                <AnimatedPromoCard
                  item={item.data}
                  index={index}
                  onPress={handleMotelPress}
                />
              );
            }

            return (
              <AnimatedMotelCard
                item={item.data}
                index={index}
                onPress={handleMotelPress}
              />
            );
          }}
          showsVerticalScrollIndicator={false}
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

      {/* Modal de selección de radio para promos */}
      <Modal
        visible={showRadiusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRadiusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRadiusModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar radio de búsqueda</Text>
            </View>
            {PROMO_RADIUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.radiusOption,
                  selectedRadius === option.value && styles.radiusOptionSelected,
                ]}
                onPress={() => {
                  if (option.value === 'PROMOS_BY_CITY') {
                    setShowRadiusModal(false);
                    navigation.navigate('CitySelector', {
                      motels,
                      mode: 'promos',
                      useProvidedMotels: true,
                    });
                    return;
                  }
                  setSelectedRadius(option.value);
                  setShowRadiusModal(false);
                }}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    selectedRadius === option.value && styles.radiusOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedRadius === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRowPromos: {
    marginBottom: 4,
  },
  locationBadge: {
    marginTop: 8,
    marginBottom: 2,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  locationLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  locationLoadingText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  radiusOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  radiusOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  radiusOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  radiusOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  promoCard: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: COLORS.card,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  promoImage: {
    borderRadius: 18,
  },
  placeholderImage: {
    opacity: 0.5,
  },
  promoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  promoBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  promoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  promoMotelName: {
    fontSize: 13,
    color: COLORS.grayLight,
    marginTop: 2,
  },
  promoDescription: {
    fontSize: 12,
    color: COLORS.divider,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
});
