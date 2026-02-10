import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const COLORS = {
  white: '#FFFFFF',
  muted: '#C5C5C5',
  primary: '#FF2E93',
  card: '#1F0F2E',
};

export default function MotelCardSmall({ motel, onPress }) {
  // isDiamond con null safety — debe estar antes de los hooks
  const isDiamond = motel?.plan === 'DIAMOND';

  // Todos los hooks ANTES del early return
  const diamondOrbit = useSharedValue(0);
  const diamondShimmer = useSharedValue(-1);

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

  const animatedOrbitStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${diamondOrbit.value}deg` }],
    };
  });
  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(diamondShimmer.value, [-1, 1], [-50, 50]);
    return {
      opacity: isDiamond ? 0.18 : 0,
      transform: [{ translateX }, { rotate: '20deg' }],
    };
  });

  // Early return después de todos los hooks
  if (!motel) return null;

  const fallbackPattern = require('../assets/motel-placeholder.png');
  const image = motel.photos?.[0] || motel.thumbnail || null;
  const imageSource = image ? { uri: image } : fallbackPattern;
  const isPlaceholder = !image;
  const ratingText =
    typeof motel.rating === 'number' && motel.rating > 0
      ? motel.rating.toFixed(1)
      : 'N/A';

  const cardBody = (
    <TouchableOpacity
      style={[styles.container, isDiamond && styles.containerNoMargin]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={imageSource} style={[styles.image, isPlaceholder && styles.placeholderImage]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {motel.nombre}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={COLORS.primary} />
          <Text style={styles.rating}>{ratingText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isDiamond) return cardBody;

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    marginRight: 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  containerNoMargin: {
    marginRight: 0,
  },
  diamondFrame: {
    padding: 2,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'visible',
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
  diamondOrbit: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    alignItems: 'center',
  },
  diamondDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#BAE6FD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
    marginTop: -3,
  },
  image: {
    width: '100%',
    height: 90,
  },
  placeholderImage: {
    opacity: 0.5,
  },
  info: {
    padding: 8,
  },
  name: {
    color: COLORS.white,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: COLORS.muted,
    marginLeft: 4,
    fontSize: 12,
  },
});
