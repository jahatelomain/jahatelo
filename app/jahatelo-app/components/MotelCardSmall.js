import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withRepeat,
  withTiming,
} from '../utils/reanimatedCompat';
import { getMotelPlanGlowTone, hasMotelPlanGlow } from '../constants/motelPlans';
import MotelLogoHeart from './MotelLogoHeart';
import { DARK_SURFACES, PLAN_COLORS } from '../constants/theme';
import { getMotelImageSource, hasRemoteMotelImage } from '../utils/mediaSource';

export default function MotelCardSmall({ motel, onPress }) {
  // isDiamond con null safety — debe estar antes de los hooks
  const isDiamond = hasMotelPlanGlow(motel?.plan);
  const glowTone = getMotelPlanGlowTone(motel?.plan);
  const glowColors = glowTone === 'gold'
    ? [PLAN_COLORS.gold, PLAN_COLORS.goldLight, PLAN_COLORS.goldDark, PLAN_COLORS.goldSoft]
    : [PLAN_COLORS.diamond, PLAN_COLORS.diamondLight, PLAN_COLORS.diamondDark, PLAN_COLORS.diamondSoft];

  // Todos los hooks ANTES del early return
  const diamondShimmer = useSharedValue(-1);

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(diamondShimmer.value, [-1, 1], [-50, 50]);
    return {
      opacity: isDiamond ? 0.18 : 0,
      transform: [{ translateX }, { rotate: '20deg' }],
    };
  });

  useEffect(() => {
    if (!isDiamond) return;
    diamondShimmer.value = withRepeat(withTiming(1, { duration: 2600 }), -1, false);
  }, [diamondShimmer, isDiamond]);

  // Early return después de todos los hooks
  if (!motel) return null;

  const image = motel.thumbnail || null;
  const imageSource = getMotelImageSource(image);
  const isPlaceholder = !hasRemoteMotelImage(image);
  const ratingText =
    typeof motel.rating === 'number' && motel.rating > 0
      ? motel.rating.toFixed(1)
      : 'N/A';

  const cardBody = (
    <TouchableOpacity
      style={[styles.container, isDiamond && styles.containerNoMargin]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${motel.nombre}. Calificación ${ratingText}`}
      accessibilityHint="Abre los detalles del motel"
    >
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={[styles.image, isPlaceholder && styles.placeholderImage]} />
        {motel.logoUrl && (
          <View style={styles.logoBadge} pointerEvents="none">
            <MotelLogoHeart uri={motel.logoUrl} size={36} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {motel.nombre}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={DARK_SURFACES.accent} />
          <Text style={styles.rating}>{ratingText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isDiamond) return cardBody;

  return (
    <LinearGradient
      colors={glowColors}
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
      <View style={styles.diamondFrameInner}>{cardBody}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    marginRight: 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: DARK_SURFACES.card,
  },
  containerNoMargin: {
    marginRight: 0,
  },
  diamondFrame: {
    padding: 2,
    borderRadius: 16,
    marginRight: 16,
    // Mantiene redondeado el marco Diamond también en iOS.
    overflow: 'hidden',
  },
  diamondFrameInner: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  diamondShimmer: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    left: -50,
    right: -50,
  },
  diamondShimmerGradient: {
    width: 100,
    height: '100%',
  },
  image: {
    width: '100%',
    height: 90,
  },
  imageContainer: {
    position: 'relative',
  },
  logoBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
  },
  placeholderImage: {
    opacity: 0.5,
  },
  info: {
    padding: 8,
  },
  name: {
    color: DARK_SURFACES.text,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: DARK_SURFACES.muted,
    marginLeft: 4,
    fontSize: 12,
  },
});
