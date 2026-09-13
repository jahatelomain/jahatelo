import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function HomeHeader({ motels = [], onMotelPress, onSearch, navigation }) {
  const colors = COLORS;
  const [searchValue, setSearchValue] = useState('');

  const handleNearbyPress = () => {
    navigation?.navigate('NearbyMotels');
  };

  const handleNotificationsPress = () => {
    navigation?.navigate('Notifications');
  };

  const triggerSearch = () => {
    const trimmed = searchValue.trim();
    onSearch?.(trimmed);
    setSearchValue(trimmed);
  };

  // HomeTabs ya aplica el área segura superior. No volver a sumar el inset acá.
  const paddingTop = Platform.select({
    ios: 8,
    android: 4,
    default: 4,
  });

  return (
    <View style={[styles.wrapper, { paddingTop, backgroundColor: colors.primary }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.cityButton, { backgroundColor: colors.white }]}
          activeOpacity={0.85}
          onPress={handleNearbyPress}
        >
          <Ionicons name="location" size={16} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.cityText, { color: colors.text }]}>Cerca de mí</Text>
        </TouchableOpacity>
        <View style={styles.rightButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.white }]}
            activeOpacity={0.85}
            onPress={handleNotificationsPress}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
            accessibilityHint="Abre tus notificaciones"
          >
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={[styles.greeting, { color: colors.white }]}>Encontrá el motel ideal para vos</Text>
        <Text style={styles.subGreeting}>Cientos de opciones para que elijas dónde ir</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.white }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          placeholder="Buscar por motel, ciudad o amenidad"
          style={[styles.searchInput, { color: colors.text }]}
          value={searchValue}
          onChangeText={setSearchValue}
          returnKeyType="search"
          onSubmitEditing={triggerSearch}
          placeholderTextColor={colors.muted}
        />
        <TouchableOpacity style={[styles.searchAction, { backgroundColor: colors.primary }]} onPress={triggerSearch}>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cityText: {
    fontWeight: '600',
  },
  greetingBlock: {
    marginTop: 14,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
  },
  subGreeting: {
    fontSize: 13,
    color: '#D8B4FE',
    marginTop: 2,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    marginLeft: 6,
    flex: 1,
    fontWeight: '600',
  },
  searchAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedPlaceholder: {
    position: 'absolute',
    left: 40,
    right: 60,
    fontSize: 12,
  },
});
