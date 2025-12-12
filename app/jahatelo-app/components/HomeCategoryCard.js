import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  card: '#FFFFFF',
  text: '#2E0338',
  shadow: '#000000',
};

export default function HomeCategoryCard({ label, iconName = 'ellipse', onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={28} color={COLORS.text} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 150,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    margin: 8,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
