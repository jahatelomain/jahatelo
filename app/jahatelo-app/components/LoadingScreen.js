import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const COLORS = {
  primary: '#7B2CBF',
  secondary: '#C239B3',
  accent: '#FF6B9D',
  white: '#FFFFFF',
};

export default function LoadingScreen({ message = 'Cargando...' }) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    // Animación de pulso
    scale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 8 })
      ),
      -1,
      false
    );

    // Animación de rotación
    rotate.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );

    // Animación de opacidad
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.7, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [opacity, rotate, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>J</Text>
          </View>
        </Animated.View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 8,
  },
});
