import { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Alert } from 'react-native';
import OfflineIndicator from './components/OfflineIndicator';
import { FavoritesProvider } from './hooks/useFavorites';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider, useNavigationContext } from './contexts/NavigationContext';
import RootNavigation from './navigation/RootNavigation';
import { initializeNotifications } from './services/notificationService';

// Prevenir que el splash nativo se oculte automáticamente
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { navigationRef } = useNavigationContext();
  const cleanupRef = useRef(null);
  const notificationDataRef = useRef(null);

  const handleNotificationNavigation = (data) => {
    if (!data || !data.type) return;

    // Guardar data para navegación después de que la app esté lista
    notificationDataRef.current = data;

    // Si navigationRef está listo, navegar inmediatamente
    if (navigationRef.current && navigationRef.current.isReady()) {
      performNavigation(data);
    }
  };

  const performNavigation = (data) => {
    try {
      switch (data.type) {
        case 'contact_message':
          // Navegar al inbox (web admin - solo para SUPERADMIN)
          // En una app real, verificarías el rol del usuario
          console.log('Navegando a inbox con messageId:', data.messageId);
          Alert.alert(
            '📨 Nuevo mensaje',
            'Tienes un nuevo mensaje de contacto. Ábrelo desde el panel de administración web.',
            [{ text: 'OK' }]
          );
          break;

        case 'promo':
          // Navegar a la pantalla de detalle del motel con la promo
          if (data.motelId) {
            navigationRef.current.navigate('MotelDetail', {
              motelId: data.motelId,
              motelSlug: data.motelSlug,
            });
          }
          break;

        case 'motel_update':
          // Navegar a detalle del motel actualizado
          if (data.motelId) {
            navigationRef.current.navigate('MotelDetail', {
              motelId: data.motelId,
              motelSlug: data.motelSlug,
            });
          }
          break;

        default:
          console.log('Tipo de notificación no reconocido:', data.type);
      }

      // Limpiar referencia después de navegar
      notificationDataRef.current = null;
    } catch (error) {
      console.error('Error al navegar desde notificación:', error);
    }
  };

  useEffect(() => {
    // Ocultar el splash nativo inmediatamente cuando la app carga
    SplashScreen.hideAsync();

    // Inicializar notificaciones push
    const setupNotifications = async () => {
      const { cleanup } = await initializeNotifications({
        onNotificationReceived: (notification) => {
          console.log('📬 Notificación recibida:', notification);
          const data = notification.request.content.data;

          // Mostrar alerta in-app cuando la notificación llega con la app abierta
          if (data.type === 'contact_message') {
            Alert.alert(
              notification.request.content.title || '📨 Notificación',
              notification.request.content.body,
              [
                { text: 'Cerrar', style: 'cancel' },
                {
                  text: 'Ver',
                  onPress: () => handleNotificationNavigation(data),
                },
              ]
            );
          }
        },
        onNotificationResponse: (response) => {
          console.log('Usuario interactuó con notificación:', response);
          const data = response.notification.request.content.data;
          handleNotificationNavigation(data);
        },
      });

      cleanupRef.current = cleanup;
    };

    setupNotifications();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Effect para manejar navegación pendiente cuando el navegador esté listo
  useEffect(() => {
    if (navigationRef.current && notificationDataRef.current) {
      const unsubscribe = navigationRef.current.addListener('state', () => {
        if (navigationRef.current.isReady() && notificationDataRef.current) {
          performNavigation(notificationDataRef.current);
        }
      });

      return unsubscribe;
    }
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigation />
      <OfflineIndicator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
