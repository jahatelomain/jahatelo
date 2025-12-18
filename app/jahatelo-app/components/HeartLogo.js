import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function HeartLogo({ size = 200 }) {
  const heartSize = size;
  const pinSize = size * 0.35;

  return (
    <View style={[styles.container, { width: heartSize, height: heartSize }]}>
      {/* Corazón con gradiente rosa-morado */}
      <Svg
        width={heartSize}
        height={heartSize}
        viewBox="0 0 100 100"
        style={styles.heart}
      >
        <Defs>
          <LinearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF6B9D" />
            <Stop offset="50%" stopColor="#C239B3" />
            <Stop offset="100%" stopColor="#7B2CBF" />
          </LinearGradient>
        </Defs>

        {/* Path del corazón */}
        <Path
          d="M50,85 C25,65 10,50 10,35 C10,20 20,10 30,10 C40,10 45,15 50,25 C55,15 60,10 70,10 C80,10 90,20 90,35 C90,50 75,65 50,85 Z"
          fill="url(#heartGradient)"
        />
      </Svg>

      {/* Pin de ubicación blanco en el centro */}
      <View style={[styles.pinContainer, { width: pinSize, height: pinSize }]}>
        <Svg
          width={pinSize}
          height={pinSize}
          viewBox="0 0 24 24"
          style={styles.pin}
        >
          {/* Pin de ubicación */}
          <Path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            fill="#FFFFFF"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heart: {
    position: 'absolute',
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pin: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
