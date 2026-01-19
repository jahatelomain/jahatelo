import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/theme';

/**
 * AdListItem - Item de publicidad para listas de moteles
 * Diseñado para verse idéntico a un MotelCard
 */
export default function AdListItem({ ad, onAdClick, onAdView }) {
  const viewTracked = useRef(false);

  // Valores animados para la card
  const scale = useSharedValue(1);
  const elevation = useSharedValue(3);

  useEffect(() => {
    // Registrar vista solo una vez cuando el componente se monta
    if (ad && !viewTracked.current && onAdView) {
      onAdView(ad);
      viewTracked.current = true;
    }
  }, [ad, onAdView]);

  if (!ad) return null;

  const handlePress = () => {
    if (onAdClick) {
      onAdClick(ad);
    }
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

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, animatedCardStyle]}>
        {/* Header con título */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
            {ad.description && (
              <Text style={styles.adDescription} numberOfLines={1}>
                {ad.description}
              </Text>
            )}
          </View>
        </View>

        {/* Fila inferior: botón ver más y badge PUBLICIDAD */}
        <View style={styles.bottomRow}>
          {ad.linkUrl && (
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Ver más</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.rightInfo}>
            <View style={styles.publicityBadge}>
              <Text style={styles.publicityText}>PUBLICIDAD</Text>
            </View>
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
    borderWidth: 1,
    borderColor: '#FFE5B4', // Borde sutil naranja para diferenciarlo
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
  adTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A0038',
    marginBottom: 2,
  },
  adDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  adBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  rightInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  publicityBadge: {
    backgroundColor: '#FFE5B4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  publicityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
});
