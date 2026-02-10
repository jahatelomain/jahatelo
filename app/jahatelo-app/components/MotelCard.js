import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { formatPrice, formatDistance } from '../services/motelsApi';
import { useFavorites } from '../hooks/useFavorites';
import { prefetchMotelDetails } from '../services/prefetchService';
import { getAmenityIconConfig } from '../constants/amenityIcons';
import { COLORS } from '../constants/theme';
import { trackFavoriteAdd, trackFavoriteRemove } from '../services/analyticsService';

export default function MotelCard({ motel, onPress }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  // Derivadas de motel con null safety — deben estar antes de los hooks
  const isDisabled = motel?.plan === 'FREE';
  const isDiamond = motel?.plan === 'DIAMOND';

  // Valores animados para la card
  const scale = useSharedValue(1);
  const elevation = useSharedValue(3);

  // Valores animados para el corazón
  const heartScale = useSharedValue(1);
  const heartRotation = useSharedValue(0);

  // Valor animado para badge PROMO
  const promoBadgeScale = useSharedValue(1);
  const diamondOrbit = useSharedValue(0);
  const diamondShimmer = useSharedValue(-1);

  // Todos los useEffect ANTES del early return
  useEffect(() => {
    if (motel?.tienePromo) {
      promoBadgeScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [motel?.tienePromo, promoBadgeScale]);

  useEffect(() => {
    if (!isDiamond) return;
    diamondOrbit.value = withRepeat(
      withTiming(360, { duration: 4200, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      diamondOrbit.value = 0;
    };
  }, [isDiamond, diamondOrbit]);

  useEffect(() => {
    if (!isDiamond) return;
    diamondShimmer.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      diamondShimmer.value = -1;
    };
  }, [isDiamond, diamondShimmer]);

  // Todos los useAnimatedStyle ANTES del early return
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

  const animatedOrbitStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${diamondOrbit.value}deg` }],
    };
  });

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(diamondShimmer.value, [-1, 1], [-60, 60]);
    return {
      opacity: isDiamond ? 0.18 : 0,
      transform: [{ translateX }, { rotate: '20deg' }],
    };
  });

  // Early return después de todos los hooks
  if (!motel) return null;

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

    const wasFavorite = isFavorite(motel.id);
    toggleFavorite(motel);

    // Track analytics
    if (wasFavorite) {
      trackFavoriteRemove(motel.id, 'LIST');
    } else {
      trackFavoriteAdd(motel.id, 'LIST');
    }
  };

  const handlePress = () => {
    // No permitir navegación si es plan FREE
    if (motel.plan === 'FREE') {
      return;
    }

    // Prefetch en background sin bloquear navegación
    prefetchMotelDetails([motel]);

    // Navegar inmediatamente
    onPress?.();
  };

  const handlePressIn = () => {
    // No animar si es plan FREE
    if (motel.plan === 'FREE') {
      return;
    }

    // Haptic feedback ligero
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 300,
    });
    elevation.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    // No animar si es plan FREE
    if (motel.plan === 'FREE') {
      return;
    }

    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 200,
    });
    elevation.value = withTiming(3, { duration: 200 });
  };

  const cardBody = (
    <Animated.View style={[styles.card, animatedCardStyle, isDisabled && styles.disabledCard, isDiamond && styles.cardNoMargin]}>
      {/* Header con nombre y favorito */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.motelName} numberOfLines={1}>{motel.nombre}</Text>
          <Text style={styles.location} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color="#888" /> {motel.ciudad || motel.barrio || 'Sin ciudad'}
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

      {/* Fila inferior: precio, badges/amenities */}
      <View style={styles.bottomRow}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(motel.precioDesde)}</Text>
          {motel.distanciaKm && (
            <Text style={styles.distance}>{formatDistance(motel.distanciaKm)}</Text>
          )}
        </View>

        <View style={styles.rightInfo}>
          {/* Badges y Amenities en una sola fila */}
          <View style={styles.badgesRow}>
            {motel.tienePromo && (
              <Animated.View style={[styles.promoBadge, animatedPromoBadgeStyle]}>
                <Ionicons name="pricetag" size={10} color="#2A0038" />
                <Text style={styles.promoText}>PROMO</Text>
              </Animated.View>
            )}
            {motel.plan === 'DIAMOND' && (
              <View style={styles.platinumBadge}>
                <Ionicons name="diamond" size={10} color="#FFFFFF" />
                <Text style={styles.platinumText}>DIAMOND</Text>
              </View>
            )}
            {motel.plan === 'GOLD' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={10} color="#FFFFFF" />
                <Text style={styles.premiumText}>GOLD</Text>
              </View>
            )}
            {!!motel.rating && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {motel.rating}</Text>
              </View>
            )}

            {/* Amenities inline con badges */}
            {motel.amenities && motel.amenities.length > 0 && (
              motel.amenities.slice(0, 3).map((amenity, index) => {
                const amenityData = typeof amenity === 'string' ? { name: amenity } : amenity;
                const iconConfig = getAmenityIconConfig(amenityData.icon);

                return iconConfig ? (
                  <View key={index} style={styles.amenityCircle}>
                    <MaterialCommunityIcons
                      name={iconConfig.name}
                      size={12}
                      color={COLORS.primary}
                    />
                  </View>
                ) : null;
              })
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      {isDiamond ? (
        <LinearGradient
          colors={['#22D3EE', '#BAE6FD', '#0EA5E9', '#7DD3FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.diamondFrame}
        >
          <Animated.View pointerEvents="none" style={[styles.diamondShimmer, animatedShimmerStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.diamondShimmerGradient}
            />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.diamondOrbit, animatedOrbitStyle]}>
            <View style={styles.diamondDot} />
          </Animated.View>
          <View style={styles.diamondFrameInner}>{cardBody}</View>
        </LinearGradient>
      ) : (
        cardBody
      )}
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
  cardNoMargin: {
    marginBottom: 0,
  },
  diamondFrame: {
    padding: 2,
    borderRadius: 18,
    marginBottom: 10,
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'visible',
  },
  diamondFrameInner: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  diamondShimmer: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    left: -60,
    right: -60,
  },
  diamondShimmerGradient: {
    width: 120,
    height: '100%',
  },
  diamondOrbit: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    alignItems: 'center',
  },
  diamondDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#BAE6FD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
    marginTop: -3,
  },
  disabledCard: {
    opacity: 0.4,
    backgroundColor: '#F5F5F5',
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
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  platinumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7DD3FC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
    shadowColor: '#7DD3FC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  platinumText: {
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
  amenityCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
