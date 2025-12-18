import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import HeartLogo from './HeartLogo';

const COLORS = {
  background: '#FFFFFF',
  title: '#2A0038',
  subtitle: '#705B85',
};

export default function AnimatedSplash() {
  // Valores de animación
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const heartPulseAnim = useRef(new Animated.Value(1)).current;
  const pinDropAnim = useRef(new Animated.Value(-50)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(30)).current;

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
      // 4. Fade in del texto
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 35,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // 5. Iniciar animación de pulso del corazón
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(heartPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo animado con efecto de pulso en el corazón */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, heartPulseAnim) },
              { translateY: pinDropAnim },
            ],
          },
        ]}
      >
        <HeartLogo size={180} />
      </Animated.View>

      {/* Textos animados */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textFadeAnim,
            transform: [{ translateY: textSlideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Jahatelo</Text>
        <Text style={styles.subtitle}>Moteles cerca tuyo, al instante</Text>
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
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.title,
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.subtitle,
    fontWeight: '400',
  },
});
