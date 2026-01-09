import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated as RNAnimated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedColors } from '../hooks/useThemedColors';

export default function HomeHeader({ motels = [], onMotelPress, onSearch, navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme } = useTheme();
  const colors = useThemedColors();
  const [searchValue, setSearchValue] = useState('');
  const placeholderOpacity = useRef(new RNAnimated.Value(1)).current;

  // Valores animados para los íconos
  const searchIconScale = useSharedValue(1);
  const searchIconRotate = useSharedValue(0);
  const arrowIconScale = useSharedValue(1);
  const arrowIconRotate = useSharedValue(0);
  const bellIconScale = useSharedValue(1);
  const intervalRef = useRef(null);

  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(placeholderOpacity, {
          toValue: 0.25,
          duration: 1400,
          useNativeDriver: true,
        }),
        RNAnimated.timing(placeholderOpacity, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [placeholderOpacity]);

  // Animación de pulse para los íconos
  const triggerIconsPulse = () => {
    // Lupa (search) - pulso con rotación
    searchIconScale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 200 }),
      withSpring(1.08, { damping: 10 }),
      withSpring(1, { damping: 12 })
    );

    searchIconRotate.value = withSequence(
      withTiming(5, { duration: 200 }),
      withTiming(-5, { duration: 300 }),
      withTiming(0, { duration: 200 })
    );

    // Flecha (arrow) - pulso con rotación y delay
    arrowIconScale.value = withDelay(
      100,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 12 })
      )
    );

    arrowIconRotate.value = withDelay(
      100,
      withSequence(
        withTiming(8, { duration: 200 }),
        withTiming(-8, { duration: 300 }),
        withTiming(0, { duration: 200 })
      )
    );

    // Campanita (bell) - con delay
    bellIconScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.25, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12 })
      )
    );
  };

  useEffect(() => {
    // Animación inicial al montar
    const initialTimeout = setTimeout(() => {
      triggerIconsPulse();
    }, 800);

    // Animación cada 20 segundos
    intervalRef.current = setInterval(() => {
      triggerIconsPulse();
    }, 20000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleNearbyPress = () => {
    navigation?.navigate('NearbyMotels');
  };

  const triggerSearch = () => {
    const trimmed = searchValue.trim();
    onSearch?.(trimmed);
    setSearchValue(trimmed);
  };

  // Estilos animados para los íconos
  const animatedSearchIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: searchIconScale.value },
      { rotate: `${searchIconRotate.value}deg` },
    ],
  }));

  const animatedArrowIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: arrowIconScale.value },
      { rotate: `${arrowIconRotate.value}deg` },
    ],
  }));

  const animatedBellIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bellIconScale.value }],
  }));

  // Reducción EXTRA agresiva del margen superior sin solapar con notch
  // iOS: resta 18px del insets, mínimo 2px | Android: resta 12px, mínimo 4px
  const paddingTop = Platform.select({
    ios: Math.max(insets.top - 18, 2),
    android: Math.max(insets.top - 12, 4),
    default: Math.max(insets.top - 12, 4),
  });

  const getThemeIcon = () => {
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

  return (
    <View style={[styles.wrapper, { paddingTop, backgroundColor: colors.primary }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.cityButton, { backgroundColor: colors.white }]}
          activeOpacity={0.85}
          onPress={handleNearbyPress}
        >
          <Ionicons name="location" size={16} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.cityText, { color: colors.text }]}>Cerca mío</Text>
        </TouchableOpacity>
        <View style={styles.rightButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.white }]}
            onPress={toggleTheme}
          >
            <Ionicons name={getThemeIcon()} size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.white }]}>
            <Animated.View style={animatedBellIconStyle}>
              <Ionicons name="notifications-outline" size={18} color={colors.text} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={[styles.greeting, { color: colors.white }]}>¡Hola!</Text>
        <Text style={styles.subGreeting}>Encontrá tu próximo destino</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.white }]}>
        <Animated.View style={animatedSearchIconStyle}>
          <Ionicons name="search" size={18} color={colors.muted} />
        </Animated.View>
        <TextInput
          placeholder=""
          style={[styles.searchInput, { color: colors.text }]}
          value={searchValue}
          onChangeText={setSearchValue}
          returnKeyType="search"
          onSubmitEditing={triggerSearch}
          placeholderTextColor={colors.muted}
        />
        <TouchableOpacity style={[styles.searchAction, { backgroundColor: colors.primary }]} onPress={triggerSearch}>
          <Animated.View style={animatedArrowIconStyle}>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
        {!searchValue && (
          <RNAnimated.Text
            style={[styles.animatedPlaceholder, { opacity: placeholderOpacity, color: colors.muted }]}
            pointerEvents="none"
          >
            Buscar moteles, barrios o amenities
          </RNAnimated.Text>
        )}
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
    fontSize: 13,
  },
});
