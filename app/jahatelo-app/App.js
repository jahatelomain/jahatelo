import { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import OfflineIndicator from './components/OfflineIndicator';
import { FavoritesProvider } from './hooks/useFavorites';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider, useNavigationContext } from './contexts/NavigationContext';
import RootNavigation from './navigation/RootNavigation';
import { initializeNotifications } from './services/notificationService';
import {
  clearStoredStagingCredentials,
  installStagingFetchInterceptor,
  isStagingEnvironment,
  loadStoredStagingCredentials,
  setStagingCredentials,
} from './services/stagingAuthService';

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
              initialTab: 'Promos',
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
    // El splash nativo se oculta en SplashScreen.js cuando AnimatedSplash ya está montado,
    // evitando el flash blanco entre el splash estático y la animación Lottie.

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
    if (!navigationRef.current || !notificationDataRef.current) return;

    const unsubscribe = navigationRef.current.addListener('state', () => {
      if (navigationRef.current?.isReady() && notificationDataRef.current) {
        const data = notificationDataRef.current;
        notificationDataRef.current = null; // Limpiar ref para evitar re-disparo
        performNavigation(data);
        unsubscribe(); // Desuscribir inmediatamente después de navegar
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigation />
      <OfflineIndicator />
    </NavigationContainer>
  );
}

export default function App() {
  const [stagingAuthChecked, setStagingAuthChecked] = useState(false);
  const [stagingAuthReady, setStagingAuthReady] = useState(!isStagingEnvironment());
  const [stagingUser, setStagingUser] = useState('');
  const [stagingPass, setStagingPass] = useState('');
  const [stagingLoading, setStagingLoading] = useState(false);
  const [stagingError, setStagingError] = useState('');

  useEffect(() => {
    const initStagingAuth = async () => {
      if (__DEV__) console.log('🚀 [APP] Inicializando autenticación staging...');

      // CRÍTICO: instalar interceptor ANTES de cualquier request
      installStagingFetchInterceptor();

      if (!isStagingEnvironment()) {
        if (__DEV__) console.log('✅ [APP] Entorno NO es staging, saltando auth');
        setStagingAuthChecked(true);
        return;
      }

      if (__DEV__) console.log('🔐 [APP] Entorno ES staging, cargando credenciales...');
      const hasStoredCredentials = await loadStoredStagingCredentials();

      if (hasStoredCredentials) {
        if (__DEV__) console.log('✅ [APP] Credenciales cargadas, app lista para iniciar');
      } else {
        if (__DEV__) console.log('⚠️  [APP] NO hay credenciales guardadas, mostrar popup');
      }

      setStagingAuthReady(hasStoredCredentials);
      setStagingAuthChecked(true);
      if (__DEV__) console.log('🎯 [APP] Inicialización staging completa, authReady:', hasStoredCredentials);
    };

    initStagingAuth();
  }, []);

  useEffect(() => {
    if (!stagingAuthChecked) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [stagingAuthChecked]);

  const validateStagingCredentials = async () => {
    if (!stagingUser.trim() || !stagingPass.trim()) {
      setStagingError('Ingresá usuario y contraseña.');
      return;
    }

    if (__DEV__) console.log('🔐 [APP] Usuario ingresó credenciales, guardando...');
    setStagingLoading(true);
    setStagingError('');
    try {
      await setStagingCredentials(stagingUser.trim(), stagingPass, true);
      if (__DEV__) console.log('✅ [APP] Credenciales guardadas, habilitando app');
      setStagingAuthReady(true);
    } catch (error) {
      console.error('❌ [APP] Error al guardar credenciales:', error);
      await clearStoredStagingCredentials();
      setStagingError('No se pudo guardar credenciales de staging.');
    } finally {
      setStagingLoading(false);
    }
  };

  if (!stagingAuthChecked) {
    return (
      <SafeAreaProvider>
        <View style={stylesStaging.loadingContainer}>
          <ActivityIndicator size="large" color="#822DE2" />
          <Text style={stylesStaging.loadingText}>Inicializando app...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (isStagingEnvironment() && !stagingAuthReady) {
    return (
      <SafeAreaProvider>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={stylesStaging.screen}
        >
          <View style={stylesStaging.card}>
            <Text style={stylesStaging.title}>Acceso Staging</Text>
            <Text style={stylesStaging.subtitle}>Ingresá credenciales para continuar</Text>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Usuario"
              placeholderTextColor="#9CA3AF"
              style={stylesStaging.input}
              value={stagingUser}
              onChangeText={setStagingUser}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="Contraseña"
              placeholderTextColor="#9CA3AF"
              style={stylesStaging.input}
              value={stagingPass}
              onChangeText={setStagingPass}
            />

            {!!stagingError && <Text style={stylesStaging.error}>{stagingError}</Text>}

            <TouchableOpacity
              activeOpacity={0.85}
              style={stylesStaging.button}
              onPress={validateStagingCredentials}
              disabled={stagingLoading}
            >
              {stagingLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={stylesStaging.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    );
  }

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

const stylesStaging = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
  },
  button: {
    marginTop: 6,
    backgroundColor: '#822DE2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  loadingText: {
    color: '#6B7280',
  },
});
