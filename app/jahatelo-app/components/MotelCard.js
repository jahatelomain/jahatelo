import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatPrice, formatDistance } from '../services/motelsApi';
import { useFavorites } from '../hooks/useFavorites';
import { prefetchMotelDetails } from '../services/prefetchService';
import { getAmenityIconConfig } from '../constants/amenityIcons';
import { COLORS } from '../constants/theme';

export default function MotelCard({ motel, onPress }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  // Valores animados para la card
  const scale = useSharedValue(1);
  const elevation = useSharedValue(3);

  // Valores animados para el corazón
  const heartScale = useSharedValue(1);
  const heartRotation = useSharedValue(0);

  // Valor animado para badge PROMO
  const promoBadgeScale = useSharedValue(1);

  if (!motel) return null;

  // Animación loop del badge PROMO
  useEffect(() => {
    if (motel.tienePromo) {
      promoBadgeScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1, // Infinite
        false
      );
    }
  }, [motel.tienePromo]);

  const handleFavoritePress = (e) => {
    // Prevenir que se dispare el onPress de la card
    e.stopPropagation();

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animación del corazón
    heartScale.value = withSpring(1.5, { damping: 10, stiffness: 300 }, () => {
      heartScale.value = withSpring(1.2, { damping: 8 }, () => {
        heartScale.value = withSpring(1, { damping: 10 });
      });
    });

    heartRotation.value = withTiming(360, { duration: 500 }, () => {
      heartRotation.value = 0;
    });

    toggleFavorite(motel);
  };

  const handlePress = () => {
    // Prefetch en background sin bloquear navegación
    prefetchMotelDetails([motel]);

    // Navegar inmediatamente
    onPress?.();
  };

  const handlePressIn = () => {
    // Haptic feedback ligero
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 300,
    });
    elevation.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 200,
    });
    elevation.value = withTiming(3, { duration: 200 });
  };

  // Estilos animados
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      elevation: elevation.value,
      shadowOpacity: elevation.value === 3 ? 0.1 : 0.05,
    };
  });

  const animatedHeartStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: heartScale.value },
        { rotate: `${heartRotation.value}deg` },
      ],
    };
  });

  const animatedPromoBadgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: promoBadgeScale.value }],
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, animatedCardStyle]}>
        {/* Header con nombre y favorito */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.motelName} numberOfLines={1}>{motel.nombre}</Text>
            <Text style={styles.location} numberOfLines={1}>
              <Ionicons name="location-outline" size={12} color="#888" /> {motel.barrio}, {motel.ciudad}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            activeOpacity={0.7}
          >
            <Animated.View style={animatedHeartStyle}>
              <Ionicons
                name={isFavorite(motel.id) ? 'heart' : 'heart-outline'}
                size={20}
                color={COLORS.primary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Fila inferior: precio, amenities, badges */}
        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(motel.precioDesde)}</Text>
            {motel.distanciaKm && (
              <Text style={styles.distance}>{formatDistance(motel.distanciaKm)}</Text>
            )}
          </View>

          <View style={styles.rightInfo}>
            {/* Badges */}
            <View style={styles.badgesRow}>
              {motel.tienePromo && (
                <Animated.View style={[styles.promoBadge, animatedPromoBadgeStyle]}>
                  <Ionicons name="pricetag" size={10} color="#2A0038" />
                  <Text style={styles.promoText}>PROMO</Text>
                </Animated.View>
              )}
              {motel.isFeatured && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={10} color="#FFFFFF" />
                  <Text style={styles.featuredText}>VIP</Text>
                </View>
              )}
              {!!motel.rating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {motel.rating}</Text>
                </View>
              )}
            </View>

            {/* Amenities compactas (solo iconos) */}
            {motel.amenities && motel.amenities.length > 0 && (
              <View style={styles.amenitiesContainer}>
                {motel.amenities.slice(0, 4).map((amenity, index) => {
                  const amenityData = typeof amenity === 'string' ? { name: amenity } : amenity;
                  const iconConfig = getAmenityIconConfig(amenityData.icon);

                  return iconConfig ? (
                    <MaterialCommunityIcons
                      key={index}
                      name={iconConfig.name}
                      size={16}
                      color={iconConfig.color}
                      style={styles.amenityIcon}
                    />
                  ) : null;
                })}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  motelName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A0038',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  favoriteButton: {
    padding: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 0,
  },
  price: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  distance: {
    fontSize: 11,
    color: '#999',
  },
  rightInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  promoText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2A0038',
    letterSpacing: 0.3,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  ratingBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  amenityIcon: {
    opacity: 0.7,
  },
});
