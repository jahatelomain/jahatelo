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
      <View style={styles.cardHeader}>
        <Text style={styles.motelName}>{motel.nombre}</Text>
        <View style={styles.headerRight}>
          {motel.distanciaKm && (
            <Text style={styles.distance}>{formatDistance(motel.distanciaKm)}</Text>
          )}
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            activeOpacity={0.7}
          >
            <Animated.View style={animatedHeartStyle}>
              <Ionicons
                name={isFavorite(motel.id) ? 'heart' : 'heart-outline'}
                size={24}
                color="#FF2E93"
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.location}>{motel.barrio}, {motel.ciudad}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Desde</Text>
        <Text style={styles.price}>{formatPrice(motel.precioDesde)}</Text>
      </View>

      {motel.amenities && motel.amenities.length > 0 && (
        <View style={styles.amenitiesContainer}>
          {motel.amenities.slice(0, 3).map((amenity, index) => {
            const amenityData = typeof amenity === 'string' ? { name: amenity } : amenity;
            const iconConfig = getAmenityIconConfig(amenityData.icon);

            return (
              <View key={index} style={styles.amenityPill}>
                {iconConfig && (
                  <MaterialCommunityIcons
                    name={iconConfig.name}
                    size={14}
                    color={iconConfig.color}
                    style={styles.amenityIcon}
                  />
                )}
                <Text style={styles.amenityText}>{amenityData.name}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.ratingRow}>
        {!!motel.rating && (
          <Text style={styles.ratingText}>⭐ {motel.rating}</Text>
        )}
        {motel.tienePromo && (
          <Animated.View style={[styles.promoBadge, animatedPromoBadgeStyle]}>
            <Text style={styles.promoText}>PROMO</Text>
          </Animated.View>
        )}
        {motel.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>PREMIUM</Text>
          </View>
        )}
      </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  motelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A0038',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF2E93',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  amenityPill: {
    backgroundColor: '#F0E6F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#2A0038',
  },
  amenityIcon: {
    marginRight: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  promoBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  promoText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2A0038',
  },
  featuredBadge: {
    backgroundColor: '#FF2E93',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
