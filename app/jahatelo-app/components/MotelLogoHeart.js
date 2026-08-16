import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Sello de logo para fotos. Usamos Image nativo en vez de SVG <Image> porque
 * los logos que se suben se convierten a WebP y SVG no los dibuja de forma
 * consistente en iOS. El corazón queda como marco y la imagen siempre se ve.
 */
export default function MotelLogoHeart({ uri, size = 42 }) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) return null;

  const logoSize = Math.round(size * 0.58);

  return (
    <View style={[styles.container, { width: size, height: size }]} accessibilityLabel="Logo del motel">
      <Ionicons name="heart" size={size * 1.12} color="#FFFFFF" style={styles.heart} />
      <Ionicons name="heart-outline" size={size * 1.12} color="#6E1C8A" style={styles.heart} />
      <Image
        source={{ uri }}
        style={[styles.logo, { width: logoSize, height: logoSize, borderRadius: logoSize / 2 }]}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A0038',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  heart: {
    position: 'absolute',
  },
  logo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
});
