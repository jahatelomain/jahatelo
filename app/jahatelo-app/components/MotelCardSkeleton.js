import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function MotelCardSkeleton() {
  const shimmerTranslateX = useSharedValue(-width);

  useEffect(() => {
    shimmerTranslateX.value = withRepeat(
      withTiming(width, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1, // Infinite
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslateX.value }],
    };
  });

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSkeleton} />
        <View style={styles.iconSkeleton} />
      </View>

      {/* Location */}
      <View style={styles.locationSkeleton} />

      {/* Price */}
      <View style={styles.priceSkeleton} />

      {/* Amenities */}
      <View style={styles.amenitiesRow}>
        <View style={styles.amenityPillSkeleton} />
        <View style={styles.amenityPillSkeleton} />
        <View style={styles.amenityPillSkeleton} />
      </View>

      {/* Shimmer effect overlay */}
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
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
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSkeleton: {
    width: '70%',
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
  },
  locationSkeleton: {
    width: '50%',
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  priceSkeleton: {
    width: '40%',
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  amenityPillSkeleton: {
    width: 70,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginRight: 6,
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerGradient: {
    width: width,
    height: '100%',
  },
});
