import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#0F0019',
  white: '#FFFFFF',
  muted: '#C5C5C5',
  primary: '#FF2E93',
};

export default function HomeHeader() {
  const [locationEnabled, setLocationEnabled] = useState(false);

  const handleLocationPress = () => {
    if (!locationEnabled) {
      setLocationEnabled(true);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>¡Hola, Jaha!</Text>
        <Text style={styles.subGreeting}>Encontrá tu próximo destino</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.locationTag,
          !locationEnabled && styles.locationTagInactive,
        ]}
        activeOpacity={0.8}
        onPress={handleLocationPress}
      >
        <Ionicons
          name="location-outline"
          size={16}
          color={COLORS.white}
        />
        <Text style={styles.locationText}>
          {locationEnabled ? 'Cerca de mí' : 'Seleccioná ciudad'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  subGreeting: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 14,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  locationTagInactive: {
    backgroundColor: '#2A1A3C',
  },
  locationText: {
    color: COLORS.white,
    fontSize: 12,
    marginLeft: 6,
  },
});
