import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Sello de logo para fotos. Usamos Image nativo en vez de SVG <Image> porque
 * los logos que se suben se convierten a WebP y SVG no los dibuja de forma
 * consistente en iOS. El corazón es un contenedor oscuro continuo: no deja
 * un aro blanco entre el logo y el borde, incluso con logos cuadrados.
 */
export default function MotelLogoHeart({ uri, size = 42 }) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) return null;

  const heartSize = Math.round(size * 1.12);
  const logoSize = Math.round(size * 0.74);

  return (
    <View style={[styles.container, { width: size, height: size }]} accessibilityLabel="Logo del motel">
      <Ionicons name="heart" size={heartSize} color="#090B12" style={styles.heart} />
      <Ionicons name="heart-outline" size={heartSize} color="#FFFFFF" style={styles.heart} />
      <View style={[styles.logoFrame, { width: logoSize, height: logoSize, borderRadius: logoSize / 2 }]}>
        <Image
          source={{ uri }}
          style={styles.logo}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      </View>
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
  logoFrame: {
    alignItems: 'center',
    backgroundColor: '#090B12',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    height: '100%',
    width: '100%',
  },
});
