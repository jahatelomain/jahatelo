import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

const COLORS = {
  background: '#FFFFFF',
};

export default function AnimatedSplash({ onFinish }) {
  // Valores de animación
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pinDropAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // Secuencia de entrada del logo
    Animated.sequence([
      // 1. Fade in + Scale up del corazón
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // 2. Pin drop (caída del pin desde arriba)
      Animated.spring(pinDropAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // 3. Delay pequeño
      Animated.delay(150),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo oficial */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: pinDropAnim },
            ],
          },
        ]}
      >
        <LottieView
          source={require('../assets/logo-lottie.json')}
          autoPlay
          loop={false}
          onAnimationFinish={() => onFinish?.()}
          style={styles.logo}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 260,
    height: 260,
  },
});
