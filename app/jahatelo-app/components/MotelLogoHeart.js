import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * Sello circular de logo para fotos. Usamos Image nativo en vez de SVG <Image>
 * porque los logos que se suben se convierten a WebP y SVG no los dibuja de
 * forma consistente en iOS.
 */
export default function MotelLogoHeart({ uri, size = 42 }) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) return null;

  return (
    <View
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel="Logo del motel"
    >
      <Image
        source={{ uri }}
        style={styles.logo}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#090B12',
    borderColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2A0038',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logo: {
    height: '88%',
    width: '88%',
  },
});
