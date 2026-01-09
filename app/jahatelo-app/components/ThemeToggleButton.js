import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedColors } from '../hooks/useThemedColors';

/**
 * Botón para cambiar entre modo claro, oscuro y automático
 */
export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const colors = useThemedColors();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'auto':
        return 'contrast';
      default:
        return 'sunny';
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Oscuro';
      case 'auto':
        return 'Auto';
      default:
        return 'Claro';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Ionicons name={getIcon()} size={20} color={colors.primary} />
      <Text style={[styles.label, { color: colors.text }]}>{getLabel()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
