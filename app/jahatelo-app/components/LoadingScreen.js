import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
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
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    // Animación de pulso
    scale.value = withRepeat(
      withSequence(
        withSpring(1.06, { damping: 12 }),
        withSpring(1, { damping: 8 })
      ),
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
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
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
          <Image source={require('../assets/logo-icon.png')} style={styles.logo} />
        </Animated.View>

        <View style={styles.loadingContainer}>
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
    width: 88,
    height: 88,
    resizeMode: 'contain',
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
