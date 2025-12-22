import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const COLORS = {
  text: '#2E0338',
  textWhite: '#FFFFFF',
  shadow: '#000000',
};

// Gradientes vibrantes para cada card
const GRADIENT_THEMES = {
  'location-outline': {
    colors: ['#FF6B9D', '#C239B3', '#7B2CBF'],
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    height: 160,
  },
  'map-outline': {
    colors: ['#00B4DB', '#0083B0', '#00D2FF'],
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    height: 160,
  },
  'flame-outline': {
    colors: ['#FF6B35', '#F7931E', '#FDC830'],
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    height: 160,
  },
  default: {
    colors: ['#667EEA', '#764BA2', '#F093FB'],
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    height: 160,
  },
};

export default function HomeCategoryCard({ label, iconName = 'ellipse', onPress }) {
  // Valores animados
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const intervalRef = useRef(null);

  // Obtener tema de gradiente según el ícono
  const theme = GRADIENT_THEMES[iconName] || GRADIENT_THEMES.default;

  // Animación de pulso/wave automática
  const triggerPulseAnimation = () => {
    // Pulso del ícono con rotación sutil
    iconScale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 200 }),
      withSpring(1.08, { damping: 10 }),
      withSpring(1, { damping: 12 })
    );

    iconRotate.value = withSequence(
      withTiming(5, { duration: 200 }),
      withTiming(-5, { duration: 300 }),
      withTiming(0, { duration: 200 })
    );

    // Efecto de glow
    glowOpacity.value = withSequence(
      withTiming(0.6, { duration: 400 }),
      withDelay(200, withTiming(0, { duration: 600 }))
    );
  };

  useEffect(() => {
    // Animación inicial al montar (después de 500ms)
    const initialTimeout = setTimeout(() => {
      triggerPulseAnimation();
    }, 500);

    // Animación cada 20 segundos
    intervalRef.current = setInterval(() => {
      triggerPulseAnimation();
    }, 20000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  // Estilos animados
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.container, animatedCardStyle]}>
       <LinearGradient
         colors={theme.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Glow effect overlay */}
          <Animated.View style={[styles.glowOverlay, animatedGlowStyle]} />

          {/* Contenido centrado */}
          <View style={styles.content}>
            {/* Ícono animado */}
            <Animated.View style={[styles.iconCircle, animatedIconStyle]}>
              <Ionicons name={iconName} size={32} color={theme.iconColor} />
            </Animated.View>

            {/* Texto */}
            <Text style={[styles.label, { color: theme.textColor }]}>
              {label}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 160,
    borderRadius: 20,
    margin: 8,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
    position: 'relative',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
