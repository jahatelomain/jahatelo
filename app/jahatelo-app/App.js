import { useCallback, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Alert, StyleSheet, View } from 'react-native';
import OfflineIndicator from './components/OfflineIndicator';
import AppUpdateModal from './components/AppUpdateModal';
import StagingAuthGate from './components/StagingAuthGate';
import ErrorBoundary from './components/ErrorBoundary';
import { FavoritesProvider } from './hooks/useFavorites';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigationContext } from './contexts/NavigationContext';
import RootNavigation from './navigation/RootNavigation';
import { initializeNotifications } from './services/notificationService';
import { storeReceivedNotification } from './services/notificationInboxService';
import { trackAppOpen, trackScreenView } from './services/analyticsService';

// Prevenir que el splash nativo se oculte automáticamente
SplashScreen.preventAutoHideAsync();

const linking = {
  prefixes: ['jahatelo://', 'https://jahatelo.com', 'https://www.jahatelo.com'],
  config: {
    screens: {
      MotelDetail: 'motels/:motelSlug',
      Search: 'search',
      Map: 'mapa',
      NearbyMotels: 'nearby',
      RegisterMotel: 'registrar-motel',
    },
  },
};

function AppContent() {
  const { token, isLoading: authLoading } = useAuth();
  const { navigationRef } = useNavigationContext();
  const cleanupRef = useRef(null);
  const notificationDataRef = useRef(null);
  const lastTrackedRouteRef = useRef(null);

  const trackCurrentRoute = useCallback(() => {
    const route = navigationRef.current?.getCurrentRoute();
    if (!route?.name || route.name === lastTrackedRouteRef.current) return;
    lastTrackedRouteRef.current = route.name;
    trackScreenView(route.name, { params: route.params ? Object.keys(route.params) : [] });
  }, [navigationRef]);

  const performNavigation = useCallback((data) => {
    try {
      switch (data.type) {
        case 'contact_message':
          Alert.alert(
            '📨 Nuevo mensaje',
            'Tienes un nuevo mensaje de contacto. Ábrelo desde el panel de administración web.',
            [{ text: 'OK' }]
          );
          break;
        case 'promo':
          if (data.motelId) {
            navigationRef.current.navigate('MotelDetail', {
              motelId: data.motelId,
              motelSlug: data.motelSlug,
              initialTab: 'Promos',
            });
          }
          break;
        case 'motel_update':
          if (data.motelId) {
            navigationRef.current.navigate('MotelDetail', {
              motelId: data.motelId,
              motelSlug: data.motelSlug,
            });
          }
          break;
        case 'review_reply':
        case 'review_like':
          if (data.motelId) {
            navigationRef.current.navigate('MotelDetail', {
              motelId: data.motelId,
              motelSlug: data.motelSlug,
              initialTab: 'Reseñas',
            });
          }
          break;
        default:
          if (__DEV__) console.log('Tipo de notificación no reconocido:', data.type);
      }
      notificationDataRef.current = null;
    } catch (error) {
      if (__DEV__) console.error('Error al navegar desde notificación:', error);
    }
  }, [navigationRef]);

  const handleNotificationNavigation = useCallback((data) => {
    if (!data || !data.type) return;
    notificationDataRef.current = data;
    if (navigationRef.current && navigationRef.current.isReady()) {
      performNavigation(data);
    }
  }, [navigationRef, performNavigation]);

  useEffect(() => {
    if (authLoading) return undefined;

    const setupNotifications = async () => {
      const { cleanup } = await initializeNotifications({
        authToken: token,
        onNotificationReceived: async (notification) => {
          if (__DEV__) console.log('📬 Notificación recibida:', notification);
          await storeReceivedNotification(notification);
          const data = notification.request.content.data;
          if (data.type === 'contact_message') {
            Alert.alert(
              notification.request.content.title || '📨 Notificación',
              notification.request.content.body,
              [
                { text: 'Cerrar', style: 'cancel' },
                { text: 'Ver', onPress: () => handleNotificationNavigation(data) },
              ]
            );
          }
        },
        onNotificationResponse: (response) => {
          if (__DEV__) console.log('Usuario interactuó con notificación:', response);
          storeReceivedNotification(response.notification).catch((error) => {
            if (__DEV__) console.error('No se pudo guardar la notificación abierta:', error);
          });
          const data = response.notification.request.content.data;
          handleNotificationNavigation(data);
        },
      });
      cleanupRef.current = cleanup;
    };

    setupNotifications();
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [authLoading, handleNotificationNavigation, token]);

  useEffect(() => {
    if (!navigationRef.current || !notificationDataRef.current) return;
    const unsubscribe = navigationRef.current.addListener('state', () => {
      if (navigationRef.current?.isReady() && notificationDataRef.current) {
        const data = notificationDataRef.current;
        notificationDataRef.current = null;
        performNavigation(data);
        unsubscribe();
      }
    });
    return unsubscribe;
  }, [navigationRef, performNavigation]);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={async () => { await trackAppOpen(); trackCurrentRoute(); }}
      onStateChange={trackCurrentRoute}
    >
      <RootNavigation />
      <OfflineIndicator />
      <AppUpdateModal />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <StagingAuthGate>
          <ErrorBoundary>
            <AuthProvider>
              <FavoritesProvider>
                <NavigationProvider>
                  <AppContent />
                </NavigationProvider>
              </FavoritesProvider>
            </AuthProvider>
          </ErrorBoundary>
        </StagingAuthGate>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});