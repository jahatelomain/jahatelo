import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import {
  getStoredNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationInboxService';

const formatReceivedAt = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    setNotifications(await getStoredNotifications());
  }, []);

  useFocusEffect(useCallback(() => {
    loadNotifications();
  }, [loadNotifications]));

  const openNotification = async (notification) => {
    setNotifications(await markNotificationRead(notification.id));
    const data = notification.data || {};
    if ((data.type === 'promo' || data.type === 'motel_update') && data.motelId) {
      navigation.navigate('MotelDetail', {
        motelId: data.motelId,
        motelSlug: data.motelSlug,
        initialTab: data.type === 'promo' ? 'Promos' : undefined,
      });
    }
  };

  const markAllRead = async () => {
    setNotifications(await markAllNotificationsRead());
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => openNotification(item)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.body}`}
    >
      <View style={[styles.iconContainer, !item.read && styles.unreadIcon]}>
        <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeading}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{formatReceivedAt(item.receivedAt)}</Text>
        </View>
        {!!item.body && <Text style={styles.notificationBody}>{item.body}</Text>}
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('NotificationPreferences')}
          accessibilityLabel="Configurar notificaciones"
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {notifications.length > 0 ? (
        <>
          {notifications.some((item) => !item.read) && (
            <TouchableOpacity style={styles.readAllButton} onPress={markAllRead}>
              <Text style={styles.readAllText}>Marcar todas como leídas</Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-outline" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Todavía no tenés notificaciones</Text>
          <Text style={styles.emptyText}>Cuando haya novedades importantes, las vas a encontrar acá.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    minHeight: 60,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.grayLight,
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  readAllButton: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  readAllText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16, gap: 10 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    backgroundColor: COLORS.white,
  },
  unreadCard: { backgroundColor: '#FAF6FF', borderColor: '#E8D5FF' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F0F5',
  },
  unreadIcon: { backgroundColor: '#EEDFFF' },
  notificationContent: { flex: 1, marginLeft: 12 },
  notificationHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  notificationTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  notificationTime: { fontSize: 11, color: COLORS.textMuted },
  notificationBody: { marginTop: 4, fontSize: 13, lineHeight: 18, color: COLORS.textMuted },
  unreadDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6, marginLeft: 8, backgroundColor: COLORS.primary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E9FF' },
  emptyTitle: { marginTop: 18, fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptyText: { marginTop: 8, fontSize: 14, lineHeight: 20, color: COLORS.textMuted, textAlign: 'center' },
});
