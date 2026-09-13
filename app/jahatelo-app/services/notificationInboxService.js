import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@jahatelo/notification-inbox/v1';
const MAX_NOTIFICATIONS = 50;

const normalizeNotification = (notification) => {
  const content = notification?.request?.content || notification?.content || {};
  const requestId = notification?.request?.identifier;
  return {
    id: requestId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: content.title || 'Notificación',
    body: content.body || '',
    data: content.data || {},
    receivedAt: Date.now(),
    read: false,
  };
};

export async function getStoredNotifications() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function storeReceivedNotification(notification) {
  const nextNotification = normalizeNotification(notification);
  const current = await getStoredNotifications();
  const withoutDuplicate = current.filter((item) => item.id !== nextNotification.id);
  const next = [nextNotification, ...withoutDuplicate].slice(0, MAX_NOTIFICATIONS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return nextNotification;
}

export async function markNotificationRead(id) {
  const current = await getStoredNotifications();
  const next = current.map((item) => item.id === id ? { ...item, read: true } : item);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function markAllNotificationsRead() {
  const current = await getStoredNotifications();
  const next = current.map((item) => ({ ...item, read: true }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
