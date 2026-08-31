import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

/**
 * Logo rectangular para listados. A diferencia del sello con forma de corazón
 * usado sobre las fotos, este formato prioriza reconocer el negocio al escanear
 * una lista vertical.
 */
export default function MotelLogoTile({ uri, size = 88 }) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) return null;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Image
        source={{ uri }}
        style={styles.image}
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
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.cardBorderSoft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
