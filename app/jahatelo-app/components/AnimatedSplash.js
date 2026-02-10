import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image } from 'react-native';
import LottieView from 'lottie-react-native';

const COLORS = {
  background: '#FFFFFF',
};

export default function AnimatedSplash({ onFinish }) {
  // Valores de animación
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pinDropAnim = useRef(new Animated.Value(-50)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

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
      // 2. Pin drop + Fade in del texto en paralelo
      Animated.parallel([
        Animated.spring(pinDropAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Texto aparece mientras el pin cae
        Animated.sequence([
          Animated.delay(0), // Sin delay, comienza inmediatamente con el pin drop
          Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // 3. Delay pequeño
      Animated.delay(150),
    ]).start();
  }, [fadeAnim, scaleAnim, pinDropAnim, textFadeAnim]);

  return (
    <View style={styles.container}>
      {/* Logo oficial con Lottie (30% más grande) */}
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

      {/* Wordmark "Jahatelo" debajo */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textFadeAnim,
          },
        ]}
      >
        <Image
          source={require('../assets/logo-text-gradient.png')}
          style={styles.text}
          resizeMode="contain"
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
    width: 338,
    height: 338,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 338,
    height: 338,
  },
  textContainer: {
    width: 220,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    width: '100%',
    height: '100%',
  },
});
