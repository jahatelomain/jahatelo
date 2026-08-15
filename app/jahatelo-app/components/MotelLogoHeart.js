import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';

const HEART_PATH = 'M50 91C45 86 10 62 10 34C10 18 22 8 37 8C45 8 52 12 57 19C62 12 69 8 77 8C92 8 104 18 104 34C104 62 69 86 64 91C60 95 54 95 50 91Z';

export default function MotelLogoHeart({ uri, size = 42 }) {
  if (!uri) return null;

  return (
    <View style={[styles.container, { width: size, height: size }]} accessibilityLabel="Logo del motel">
      <Svg width={size} height={size} viewBox="0 0 114 100">
        <Defs><ClipPath id="motel-logo-heart"><Path d={HEART_PATH} /></ClipPath></Defs>
        <SvgImage href={{ uri }} width="114" height="100" preserveAspectRatio="xMidYMid slice" clipPath="url(#motel-logo-heart)" />
        <Path d={HEART_PATH} fill="none" stroke="#FFFFFF" strokeWidth="4" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginRight: 9, shadowColor: '#2A0038', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
});
