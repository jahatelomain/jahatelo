import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, Pattern, Rect, Path, Circle, Line, Polygon } from 'react-native-svg';

const COLORS = {
  text: '#2E0338',
  textWhite: '#FFFFFF',
  shadow: '#000000',
};

// Componente de patrón de ciudades (edificios)
const CitiesPattern = ({ isHorizontal }) => (
  <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
    <Defs>
      <Pattern id="citiesPattern" patternUnits="userSpaceOnUse" width="120" height="120">
        <Rect width="120" height="120" fill="#1a0a2e" />
        {/* Edificios con diferentes alturas */}
        <Rect x="5" y="70" width="15" height="50" fill="#3d1f5c" opacity="0.75" />
        <Rect x="5" y="68" width="15" height="2" fill="#5a3380" opacity="0.75" />
        <Rect x="25" y="50" width="18" height="70" fill="#3d1f5c" opacity="0.75" />
        <Rect x="25" y="48" width="18" height="2" fill="#5a3380" opacity="0.75" />
        <Rect x="48" y="60" width="14" height="60" fill="#3d1f5c" opacity="0.75" />
        <Rect x="48" y="58" width="14" height="2" fill="#5a3380" opacity="0.75" />
        <Rect x="67" y="45" width="20" height="75" fill="#3d1f5c" opacity="0.75" />
        <Rect x="67" y="43" width="20" height="2" fill="#5a3380" opacity="0.75" />
        <Rect x="92" y="65" width="16" height="55" fill="#3d1f5c" opacity="0.75" />
        <Rect x="92" y="63" width="16" height="2" fill="#5a3380" opacity="0.75" />
        {/* Ventanas pequeñas */}
        <Rect x="8" y="75" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <Rect x="14" y="75" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <Rect x="8" y="85" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <Rect x="14" y="85" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <Rect x="30" y="55" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <Rect x="37" y="55" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <Rect x="30" y="65" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
        <Rect x="37" y="65" width="3" height="4" fill="#8b5fb8" opacity="0.5" />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#citiesPattern)" />
  </Svg>
);

// Componente de patrón de mapa (líneas topográficas)
const MapPattern = ({ isHorizontal }) => (
  <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
    <Defs>
      <Pattern id="mapPattern" patternUnits="userSpaceOnUse" width="100" height="100">
        <Rect width="100" height="100" fill="#0a1a2e" />
        {/* Líneas de contorno topográficas curvas */}
        <Path d="M0,20 Q25,18 50,20 T100,20" stroke="#1e4d6b" strokeWidth="1.5" fill="none" opacity="0.75" />
        <Path d="M0,35 Q25,33 50,35 T100,35" stroke="#1e4d6b" strokeWidth="1.5" fill="none" opacity="0.75" />
        <Path d="M0,50 Q25,48 50,50 T100,50" stroke="#2a6f8f" strokeWidth="2" fill="none" opacity="0.75" />
        <Path d="M0,65 Q25,63 50,65 T100,65" stroke="#1e4d6b" strokeWidth="1.5" fill="none" opacity="0.75" />
        <Path d="M0,80 Q25,78 50,80 T100,80" stroke="#1e4d6b" strokeWidth="1.5" fill="none" opacity="0.75" />
        {/* Puntos de marcadores */}
        <Circle cx="20" cy="35" r="2.5" fill="#3a8fb7" opacity="0.75" />
        <Circle cx="50" cy="50" r="3" fill="#3a8fb7" opacity="0.8" />
        <Circle cx="75" cy="65" r="2.5" fill="#3a8fb7" opacity="0.75" />
        {/* Líneas de grilla sutiles */}
        <Line x1="33" y1="0" x2="33" y2="100" stroke="#1e4d6b" strokeWidth="0.5" opacity="0.5" />
        <Line x1="66" y1="0" x2="66" y2="100" stroke="#1e4d6b" strokeWidth="0.5" opacity="0.5" />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#mapPattern)" />
  </Svg>
);

// Componente de patrón de llamas (populares)
const FlamePattern = ({ isHorizontal }) => (
  <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
    <Defs>
      <Pattern id="flamePattern" patternUnits="userSpaceOnUse" width="80" height="100">
        <Rect width="80" height="100" fill="#1a0f0a" />
        {/* Llamas con formas orgánicas */}
        <Path
          d="M15,100 Q12,85 15,70 Q18,55 15,40 Q12,25 15,10 Q20,15 22,25 Q24,40 22,55 Q20,70 22,85 Q20,95 15,100"
          fill="#4a1f0f"
          opacity="0.75"
        />
        <Path
          d="M40,100 Q37,80 40,60 Q43,40 40,20 Q37,10 40,0 Q45,8 47,20 Q49,40 47,60 Q45,80 47,95 Q43,100 40,100"
          fill="#5a2f1f"
          opacity="0.75"
        />
        <Path
          d="M65,100 Q62,88 65,75 Q68,58 65,45 Q62,30 65,15 Q70,20 72,30 Q74,45 72,60 Q70,75 72,90 Q68,98 65,100"
          fill="#4a1f0f"
          opacity="0.75"
        />
        {/* Partículas/chispas */}
        <Circle cx="10" cy="30" r="1.5" fill="#7a4f2f" opacity="0.6" />
        <Circle cx="28" cy="45" r="1" fill="#7a4f2f" opacity="0.5" />
        <Circle cx="52" cy="25" r="1.5" fill="#7a4f2f" opacity="0.6" />
        <Circle cx="70" cy="50" r="1" fill="#7a4f2f" opacity="0.5" />
        <Circle cx="35" cy="15" r="1" fill="#7a4f2f" opacity="0.5" />
        {/* Ondas de calor */}
        <Path d="M0,60 Q10,58 20,60 T40,60 T60,60 T80,60" stroke="#5a2f1f" strokeWidth="0.5" fill="none" opacity="0.5" />
        <Path d="M0,75 Q10,73 20,75 T40,75 T60,75 T80,75" stroke="#5a2f1f" strokeWidth="0.5" fill="none" opacity="0.5" />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#flamePattern)" />
  </Svg>
);

// Configuración de temas con patrones
const PATTERN_THEMES = {
  'location-outline': {
    PatternComponent: CitiesPattern,
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    height: 160,
  },
  'map-outline': {
    PatternComponent: MapPattern,
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    height: 160,
  },
  'flame-outline': {
    PatternComponent: FlamePattern,
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    height: 160,
  },
  default: {
    PatternComponent: CitiesPattern,
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    height: 160,
  },
};

export default function HomeCategoryCard({ label, iconName = 'ellipse', onPress, isHorizontal = false }) {
  // Valores animados
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const intervalRef = useRef(null);

  // Obtener tema de patrón según el ícono
  const theme = PATTERN_THEMES[iconName] || PATTERN_THEMES.default;
  const PatternComponent = theme.PatternComponent;

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
      <Animated.View style={[
        isHorizontal ? styles.containerHorizontal : styles.container,
        animatedCardStyle
      ]}>
        <View style={isHorizontal ? styles.gradientHorizontal : styles.gradient}>
          {/* Patrón de fondo */}
          <PatternComponent isHorizontal={isHorizontal} />

          {/* Glow effect overlay */}
          <Animated.View style={[styles.glowOverlay, animatedGlowStyle]} />

          {/* Contenido */}
          <View style={isHorizontal ? styles.contentHorizontal : styles.content}>
            {/* Ícono animado */}
            <Animated.View style={[
              isHorizontal ? styles.iconCircleHorizontal : styles.iconCircle,
              animatedIconStyle
            ]}>
              <Ionicons name={iconName} size={isHorizontal ? 28 : 32} color={theme.iconColor} />
            </Animated.View>

            {/* Texto */}
            <Text style={[
              isHorizontal ? styles.labelHorizontal : styles.label,
              { color: theme.textColor }
            ]}>
              {label}
            </Text>
          </View>
        </View>
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
  containerHorizontal: {
    height: 80,
    borderRadius: 20,
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
  gradientHorizontal: {
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
  contentHorizontal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
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
  iconCircleHorizontal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
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
  labelHorizontal: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
