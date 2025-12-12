import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  background: '#F4EFFB',
  heart: '#8E2DE2',
  heartDark: '#6A1FB5',
  pin: '#FFFFFF',
};

export default function AnimatedSplash() {
  const pinTranslate = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pinTranslate, {
            toValue: -12,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1.04,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pinTranslate, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.spring(heartScale, {
            toValue: 1,
            damping: 6,
            stiffness: 90,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [heartScale, pinTranslate]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.heartContainer, { transform: [{ scale: heartScale }] }]}>
        <View style={styles.leftCircle} />
        <View style={styles.rightCircle} />
        <View style={styles.bottomSquare} />
        <Animated.View style={[styles.pinWrapper, { transform: [{ translateY: pinTranslate }] }]}>
          <View style={styles.pinOuter}>
            <View style={styles.pinInner} />
          </View>
        </Animated.View>
      </Animated.View>
      <Text style={styles.title}>Jahatelo</Text>
      <Text style={styles.subtitle}>Moteles cerca tuyo, al instante</Text>
    </View>
  );
}

const HEART_SIZE = 140;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  heartContainer: {
    width: HEART_SIZE,
    height: HEART_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftCircle: {
    position: 'absolute',
    width: HEART_SIZE * 0.58,
    height: HEART_SIZE * 0.58,
    borderRadius: HEART_SIZE * 0.29,
    backgroundColor: COLORS.heart,
    left: HEART_SIZE * 0.05,
    top: HEART_SIZE * 0.08,
  },
  rightCircle: {
    position: 'absolute',
    width: HEART_SIZE * 0.58,
    height: HEART_SIZE * 0.58,
    borderRadius: HEART_SIZE * 0.29,
    backgroundColor: COLORS.heart,
    right: HEART_SIZE * 0.05,
    top: HEART_SIZE * 0.08,
  },
  bottomSquare: {
    position: 'absolute',
    width: HEART_SIZE * 0.7,
    height: HEART_SIZE * 0.7,
    backgroundColor: COLORS.heartDark,
    bottom: HEART_SIZE * 0.08,
    transform: [{ rotate: '45deg' }],
    borderBottomLeftRadius: HEART_SIZE * 0.2,
  },
  pinWrapper: {
    position: 'absolute',
    width: HEART_SIZE * 0.4,
    height: HEART_SIZE * 0.4,
    borderRadius: HEART_SIZE * 0.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOuter: {
    width: '100%',
    height: '100%',
    borderRadius: HEART_SIZE * 0.2,
    backgroundColor: COLORS.pin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInner: {
    width: '45%',
    height: '45%',
    borderRadius: HEART_SIZE * 0.1,
    borderWidth: 3,
    borderColor: COLORS.heart,
  },
  title: {
    marginTop: 32,
    fontSize: 26,
    fontWeight: '700',
    color: '#3C205B',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#705B85',
  },
});
