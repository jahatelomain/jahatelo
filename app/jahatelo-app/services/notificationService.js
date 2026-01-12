import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Configuración global de notificaciones
 * Define cómo se comportan las notificaciones cuando la app está en primer plano
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos para notificaciones push
 * @returns {Promise<boolean>} true si se otorgaron permisos
 */
export async function registerForPushNotificationsAsync() {
  let token;

  // Solo dispositivos físicos pueden recibir notificaciones
  if (!Device.isDevice) {
    console.log('Las notificaciones push solo funcionan en dispositivos físicos');
    return null;
  }

  try {
    // Verificar permisos actuales
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si no hay permisos, solicitarlos
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Si no se otorgaron permisos, retornar null
    if (finalStatus !== 'granted') {
      console.log('No se otorgaron permisos para notificaciones');
      return null;
    }

    // Obtener el token de Expo
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || 'default-project-id',
    });

    // Configurar canal de notificaciones en Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificaciones generales',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#822DE2',
      });

      // Canal para mensajes de contacto (solo admins)
      await Notifications.setNotificationChannelAsync('contact_messages', {
        name: 'Mensajes de contacto',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'default',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registrando notificaciones push:', error);
    return null;
  }
}

/**
 * Registra el token de push en el backend
 * @param {string} token - Token de Expo Push
 * @param {string} userId - ID del usuario (opcional)
 * @returns {Promise<boolean>} true si se registró exitosamente
 */
export async function registerPushToken(token, userId = null) {
  try {
    // Obtener información del dispositivo
    const deviceInfo = {
      deviceId: Constants.deviceId || Constants.installationId,
      deviceType: Platform.OS,
      deviceName: Device.deviceName || `${Device.brand} ${Device.modelName}`,
      appVersion: Constants.expoConfig?.version || '1.0.0',
    };

    const response = await fetch(`${API_URL}/api/push-tokens/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        userId,
        ...deviceInfo,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('Token de push registrado exitosamente');
      return true;
    } else {
      console.error('Error registrando token:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error al registrar token en el backend:', error);
    return false;
  }
}

/**
 * Desregistra el token de push del backend
 * @param {string} token - Token de Expo Push
 * @returns {Promise<boolean>} true si se desregistró exitosamente
 */
export async function unregisterPushToken(token) {
  try {
    const response = await fetch(`${API_URL}/api/push-tokens/register`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error al desregistrar token:', error);
    return false;
  }
}

/**
 * Configura el listener para notificaciones recibidas mientras la app está abierta
 * @param {function} handler - Función que se ejecuta cuando se recibe una notificación
 * @returns {Subscription} Suscripción que se puede cancelar
 */
export function addNotificationReceivedListener(handler) {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Configura el listener para cuando el usuario toca una notificación
 * @param {function} handler - Función que se ejecuta cuando se toca una notificación
 * @returns {Subscription} Suscripción que se puede cancelar
 */
export function addNotificationResponseReceivedListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Obtiene el número de notificaciones no leídas (badge)
 * @returns {Promise<number>}
 */
export async function getBadgeCountAsync() {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Establece el número de notificaciones no leídas (badge)
 * @param {number} count - Número de notificaciones
 */
export async function setBadgeCountAsync(count) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Limpia todas las notificaciones
 */
export async function dismissAllNotificationsAsync() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Inicializa el servicio de notificaciones completo
 * Registra el token, configura listeners, etc.
 * @param {object} options - Opciones de configuración
 * @param {string} options.userId - ID del usuario (opcional)
 * @param {function} options.onNotificationReceived - Handler para notificaciones recibidas
 * @param {function} options.onNotificationResponse - Handler para interacción con notificaciones
 * @returns {Promise<object>} Objeto con token y funciones de cleanup
 */
export async function initializeNotifications(options = {}) {
  const { userId = null, onNotificationReceived, onNotificationResponse } = options;

  // Registrar y obtener token
  const token = await registerForPushNotificationsAsync();

  if (!token) {
    console.log('No se pudo obtener el token de notificaciones');
    return { token: null, cleanup: () => {} };
  }

  // Registrar token en el backend
  await registerPushToken(token, userId);

  // Configurar listeners
  const receivedSubscription = onNotificationReceived
    ? addNotificationReceivedListener(onNotificationReceived)
    : null;

  const responseSubscription = onNotificationResponse
    ? addNotificationResponseReceivedListener(onNotificationResponse)
    : null;

  // Función de cleanup para desuscribirse
  const cleanup = () => {
    if (receivedSubscription) {
      receivedSubscription.remove();
    }
    if (responseSubscription) {
      responseSubscription.remove();
    }
  };

  return {
    token,
    cleanup,
  };
}
