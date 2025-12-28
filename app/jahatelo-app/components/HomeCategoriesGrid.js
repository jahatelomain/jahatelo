import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeCategoryCard from './HomeCategoryCard';

const COLORS = {
  text: '#2E0338',
  card: '#FFFFFF',
  shadow: '#000000',
};

const SOCIAL_LINKS = [
  {
    iconName: 'logo-instagram',
    url: 'https://www.instagram.com/jahatelopy',
    enabled: true,
    bgType: 'gradient',
    gradient: ['#833AB4', '#FD1D1D', '#FCAF45'],
    iconColor: '#FFFFFF',
  },
  {
    iconName: 'logo-facebook',
    url: 'https://www.facebook.com/share/16GAY8bcxU/',
    enabled: true,
    bgType: 'solid',
    bgColor: '#1877F2',
    iconColor: '#FFFFFF',
  },
  {
    iconName: 'logo-tiktok',
    url: 'https://www.tiktok.com/@jahatelo',
    enabled: true,
    bgType: 'solid',
    bgColor: '#000000',
    iconColor: '#FFFFFF',
  },
  {
    iconName: 'logo-whatsapp',
    url: null,
    enabled: false,
    bgType: 'solid',
    bgColor: '#25D366',
    iconColor: '#FFFFFF',
  },
];

const PartnerLogo = ({ iconName, url, enabled, bgType, gradient, bgColor, iconColor, index }) => {
  const handlePress = async () => {
    if (!enabled || !url) return;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error al abrir enlace:', error);
    }
  };

  const renderBackground = () => {
    if (!enabled) {
      return (
        <View style={[styles.logoCircle, styles.logoCircleDisabled]}>
          <Ionicons name={iconName} size={20} color="#CCCCCC" />
        </View>
      );
    }

    if (bgType === 'gradient') {
      return (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoCircle}
        >
          <Ionicons name={iconName} size={20} color={iconColor} />
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.logoCircle, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(400 + index * 100).duration(600).springify()}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={enabled ? 0.7 : 1}
        disabled={!enabled}
      >
        {renderBackground()}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeCategoriesGrid({ categories = [] }) {
  // Separar el botón de mapa de los demás
  const mapCategory = categories.find(cat => cat.id === 'map');
  const otherCategories = categories.filter(cat => cat.id !== 'map');

  return (
    <View style={styles.container}>
      {/* Botón de mapa horizontal */}
      {mapCategory && (
        <View style={styles.mapButtonWrapper}>
          <HomeCategoryCard
            label={mapCategory.label}
            iconName={mapCategory.iconName}
            onPress={mapCategory.onPress}
            isHorizontal={true}
          />
        </View>
      )}

      {/* Otros botones en grid 2 columnas */}
      <FlatList
        data={otherCategories}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <HomeCategoryCard label={item.label} iconName={item.iconName} onPress={item.onPress} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />

      <View style={styles.partnersContainer}>
        <Text style={styles.partnersTitle}>¡Encontranos!</Text>
        <View style={styles.logosRow}>
          {SOCIAL_LINKS.map((social, index) => (
            <PartnerLogo
              key={social.iconName}
              iconName={social.iconName}
              url={social.url}
              enabled={social.enabled}
              bgType={social.bgType}
              gradient={social.gradient}
              bgColor={social.bgColor}
              iconColor={social.iconColor}
              index={index}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  mapButtonWrapper: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  grid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '48%',
  },
  partnersContainer: {
    marginTop: 8,
  },
  partnersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  logosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircleDisabled: {
    opacity: 0.4,
    backgroundColor: COLORS.card,
  },
});
