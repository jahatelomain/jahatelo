import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * Sello circular de logo para fotos. Usamos Image nativo en vez de SVG <Image>
 * porque los logos que se suben se convierten a WebP y SVG no los dibuja de
 * forma consistente en iOS.
 */
export default function MotelLogoHeart({ uri, size = 42, scale = 1 }) {
  const [failed, setFailed] = useState(false);
  const normalizedScale = Math.min(1, Math.max(0.6, scale || 1));

  if (!uri || failed) return null;

  return (
    <View
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel="Logo del motel"
    >
      <Image
        source={{ uri }}
        style={[
          styles.logo,
          { borderRadius: size / 2, transform: [{ scale: normalizedScale }] },
        ]}
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
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
});
