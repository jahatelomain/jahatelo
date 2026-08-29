import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

export default function LoadingScreen({ message = 'Cargando...' }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }

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
  }, [opacity, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container} accessible accessibilityRole="progressbar" accessibilityLiveRegion="polite" accessibilityLabel={message}>
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary, COLORS.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <Image source={require('../assets/logo-icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
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
