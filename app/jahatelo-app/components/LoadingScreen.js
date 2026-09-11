import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, View, StyleSheet, Image } from 'react-native';
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
      <View style={styles.background}>
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <Image source={require('../assets/logo-icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 176,
    height: 176,
    resizeMode: 'contain',
  },
});
