import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { fetchMotelBySlug } from '../services/motelsApi';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../hooks/useFavorites';
import PromosTab from './motelDetail/PromosTab';
import DetailsTab from './motelDetail/DetailsTab';
import RoomsTab from './motelDetail/RoomsTab';
import MenuTab from './motelDetail/MenuTab';

const Tab = createMaterialTopTabNavigator();

export default function MotelDetailScreen({ route, navigation }) {
  const { motelSlug, motelId } = route.params || {};
  const [motel, setMotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  // Priorizar slug, caer a ID si no hay slug
  const identifier = motelSlug || motelId;

  const loadMotel = async () => {
    if (!identifier) {
      setError('No se proporcionó ID o slug del motel');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchMotelBySlug(identifier);
      setMotel(data);
    } catch (err) {
      console.error('Error al cargar motel:', err);
      setError(err.message || 'Error al cargar el motel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMotel();
  }, [identifier]);

  // Handler para llamada telefónica
  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.error('No se puede abrir el marcador telefónico');
        }
      })
      .catch((err) => console.error('Error al intentar llamar:', err));
  };

  // Handler para WhatsApp
  const handleWhatsApp = (whatsappNumber) => {
    if (!whatsappNumber) return;
    // Remover caracteres no numéricos
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.error('No se puede abrir WhatsApp');
        }
      })
      .catch((err) => console.error('Error al abrir WhatsApp:', err));
  };

  // Mostrar loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF2E93" />
          <Text style={styles.loadingText}>Cargando motel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mostrar error con botón para reintentar
  if (error || !motel) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF2E93" />
          <Text style={styles.errorTitle}>Motel no encontrado</Text>
          <Text style={styles.errorText}>
            {error || 'No pudimos cargar la información de este motel.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadMotel}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Obtener foto principal del motel o usar placeholder
  const mainPhoto = motel.thumbnail || motel.photos?.[0] || 'https://picsum.photos/800/600?random=999';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Foto grande del motel */}
      <View style={styles.photoContainer}>
        <Image
          source={{ uri: mainPhoto }}
          style={styles.motelPhoto}
          resizeMode="cover"
        />
        {/* Botón volver posicionado sobre la foto */}
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        {/* Botón favorito posicionado sobre la foto */}
        <TouchableOpacity
          style={styles.favoriteIconButton}
          onPress={() => toggleFavorite(motel)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorite(motel.id) ? 'heart' : 'heart-outline'}
            size={28}
            color="#FF2E93"
          />
        </TouchableOpacity>
      </View>

      {/* Header con nombre del motel */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.motelName} numberOfLines={1}>{motel.nombre}</Text>
          <Text style={styles.motelLocation} numberOfLines={1}>
            {motel.barrio}, {motel.ciudad}
          </Text>
        </View>
        {/* Botones de contacto */}
        <View style={styles.contactButtons}>
          {motel.contact?.phone && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleCall(motel.contact.phone)}
            >
              <Ionicons name="call" size={20} color="#FF2E93" />
            </TouchableOpacity>
          )}
          {motel.contact?.whatsapp && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleWhatsApp(motel.contact.whatsapp)}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Material Top Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarItemStyle: {
            width: 'auto',
            paddingHorizontal: 8,
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#FF2E93',
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
          },
          tabBarActiveTintColor: '#FF2E93',
          tabBarInactiveTintColor: '#666',
        }}
      >
        {/* Construir tabs dinámicamente según contenido disponible */}
        {(() => {
          const availableTabs = [];

          // Incluir Promos solo si hay promos
          if (motel.promos && motel.promos.length > 0) {
            availableTabs.push({
              name: 'Promos',
              component: PromosTab,
            });
          }

          // Detalles siempre se muestra
          availableTabs.push({
            name: 'Detalles',
            component: DetailsTab,
          });

          // Habitaciones solo si hay rooms
          if (motel.rooms && motel.rooms.length > 0) {
            availableTabs.push({
              name: 'Habitaciones',
              component: RoomsTab,
            });
          }

          // Menú solo si hay categorías de menú
          if (motel.menu && motel.menu.length > 0) {
            availableTabs.push({
              name: 'Menú',
              component: MenuTab,
            });
          }

          return availableTabs.map((tab) => (
            <Tab.Screen
              key={tab.name}
              name={tab.name}
              component={tab.component}
              initialParams={{ motel }}
            />
          ));
        })()}
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
  },
  motelPhoto: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backIconButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIconButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerInfo: {
    flex: 1,
  },
  motelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A0038',
  },
  motelLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A0038',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF2E93',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A0038',
  },
});
