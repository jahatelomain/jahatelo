import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * Logo rectangular para listados. A diferencia del sello con forma de corazón
 * usado sobre las fotos, este formato prioriza reconocer el negocio al escanear
 * una lista vertical.
 */
export default function MotelLogoTile({ uri, size = 88, scale = 1 }) {
  const [failed, setFailed] = useState(false);
  const normalizedScale = Math.min(1, Math.max(0.6, scale || 1));

  if (!uri || failed) return null;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Image
        source={{ uri }}
        style={[styles.image, { transform: [{ scale: normalizedScale }] }]}
        resizeMode="contain"
        accessibilityLabel="Logo del motel"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#F5F3F7',
    borderWidth: 1,
    borderColor: '#EEE8F1',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
