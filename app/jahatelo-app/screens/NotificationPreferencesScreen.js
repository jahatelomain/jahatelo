import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000';

export default function NotificationPreferencesScreen({ navigation }) {
  const { isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    enableNotifications: true,
    enableEmail: true,
    enablePush: true,
    notifyNewPromos: true,
    notifyPriceDrops: true,
    notifyUpdates: true,
    notifyReviewReplies: true,
    notifyReviewLikes: false,
    notifyPromotions: true,
    notifyNewMotels: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    } else {
      navigation.replace('Login');
    }
  }, [isAuthenticated]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/mobile/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences({
            enableNotifications: data.preferences.enableNotifications ?? true,
            enableEmail: data.preferences.enableEmail ?? true,
            enablePush: data.preferences.enablePush ?? true,
            notifyNewPromos: data.preferences.notifyNewPromos ?? true,
            notifyPriceDrops: data.preferences.notifyPriceDrops ?? true,
            notifyUpdates: data.preferences.notifyUpdates ?? true,
            notifyReviewReplies: data.preferences.notifyReviewReplies ?? true,
            notifyReviewLikes: data.preferences.notifyReviewLikes ?? false,
            notifyPromotions: data.preferences.notifyPromotions ?? true,
            notifyNewMotels: data.preferences.notifyNewMotels ?? false,
          });
        }
      } else {
        Alert.alert('Error', 'No se pudieron cargar las preferencias');
      }
    } catch (error) {
      console.error('Error al cargar preferencias:', error);
      Alert.alert('Error', 'No se pudieron cargar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    // Actualizar estado local inmediatamente para mejor UX
    setPreferences(prev => ({ ...prev, [key]: value }));

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/mobile/notifications/preferences`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        // Revertir cambio si falla
        setPreferences(prev => ({ ...prev, [key]: !value }));
        Alert.alert('Error', 'No se pudo actualizar la preferencia');
      }
    } catch (error) {
      console.error('Error al actualizar preferencia:', error);
      // Revertir cambio si falla
      setPreferences(prev => ({ ...prev, [key]: !value }));
      Alert.alert('Error', 'No se pudo actualizar la preferencia');
    } finally {
      setSaving(false);
    }
  };

  const toggleSwitch = (key) => {
    updatePreference(key, !preferences[key]);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando preferencias...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Controles Generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración General</Text>
          <View style={styles.optionsContainer}>
            <PreferenceItem
              icon="notifications-outline"
              title="Todas las notificaciones"
              description="Habilitar o deshabilitar todas las notificaciones"
              value={preferences.enableNotifications}
              onToggle={() => toggleSwitch('enableNotifications')}
              disabled={saving}
              highlighted
            />
            <PreferenceItem
              icon="mail-outline"
              title="Notificaciones por email"
              description="Recibir notificaciones en tu correo electrónico"
              value={preferences.enableEmail}
              onToggle={() => toggleSwitch('enableEmail')}
              disabled={saving || !preferences.enableNotifications}
            />
            <PreferenceItem
              icon="phone-portrait-outline"
              title="Notificaciones push"
              description="Recibir notificaciones en tu dispositivo"
              value={preferences.enablePush}
              onToggle={() => toggleSwitch('enablePush')}
              disabled={saving || !preferences.enableNotifications}
            />
          </View>
        </View>

        {/* Notificaciones de Favoritos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favoritos y Ofertas</Text>
          <View style={styles.optionsContainer}>
            <PreferenceItem
              icon="pricetag-outline"
              title="Nuevas promociones"
              description="Cuando tus favoritos tengan promos nuevas"
              value={preferences.notifyNewPromos}
              onToggle={() => toggleSwitch('notifyNewPromos')}
              disabled={saving || !preferences.enableNotifications}
            />
            <PreferenceItem
              icon="trending-down-outline"
              title="Bajadas de precio"
              description="Cuando bajen los precios de tus favoritos"
              value={preferences.notifyPriceDrops}
              onToggle={() => toggleSwitch('notifyPriceDrops')}
              disabled={saving || !preferences.enableNotifications}
            />
            <PreferenceItem
              icon="information-circle-outline"
              title="Actualizaciones"
              description="Cambios en la información de tus favoritos"
              value={preferences.notifyUpdates}
              onToggle={() => toggleSwitch('notifyUpdates')}
              disabled={saving || !preferences.enableNotifications}
            />
          </View>
        </View>

        {/* Notificaciones de Reseñas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reseñas</Text>
          <View style={styles.optionsContainer}>
            <PreferenceItem
              icon="chatbubble-outline"
              title="Respuestas a mis reseñas"
              description="Cuando el motel responda a tu reseña"
              value={preferences.notifyReviewReplies}
              onToggle={() => toggleSwitch('notifyReviewReplies')}
              disabled={saving || !preferences.enableNotifications}
            />
            <PreferenceItem
              icon="heart-outline"
              title="Me gusta en mis reseñas"
              description="Cuando otros usuarios den like a tus reseñas"
              value={preferences.notifyReviewLikes}
              onToggle={() => toggleSwitch('notifyReviewLikes')}
              disabled={saving || !preferences.enableNotifications}
            />
          </View>
        </View>

        {/* Notificaciones Generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.optionsContainer}>
            <PreferenceItem
              icon="megaphone-outline"
              title="Promociones de Jahatelo"
              description="Ofertas especiales y novedades de la plataforma"
              value={preferences.notifyPromotions}
              onToggle={() => toggleSwitch('notifyPromotions')}
              disabled={saving || !preferences.enableNotifications}
            />
            <PreferenceItem
              icon="business-outline"
              title="Nuevos moteles"
              description="Cuando se agreguen nuevos moteles en tu zona"
              value={preferences.notifyNewMotels}
              onToggle={() => toggleSwitch('notifyNewMotels')}
              disabled={saving || !preferences.enableNotifications}
            />
          </View>
        </View>

        {/* Info Footer */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textLight} />
          <Text style={styles.infoText}>
            Puedes cambiar estas preferencias en cualquier momento. Las notificaciones push requieren
            permisos del dispositivo.
          </Text>
        </View>

        {/* Espaciado inferior */}
        <View style={styles.footer} />
      </ScrollView>

      {/* Indicador de guardado */}
      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={COLORS.white} />
          <Text style={styles.savingText}>Guardando...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Componente reutilizable para cada preferencia
function PreferenceItem({ icon, title, description, value, onToggle, disabled, highlighted }) {
  return (
    <View style={[styles.preferenceItem, highlighted && styles.preferenceItemHighlighted]}>
      <View style={styles.preferenceLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={highlighted ? COLORS.primary : COLORS.text}
          style={styles.preferenceIcon}
        />
        <View style={styles.preferenceContent}>
          <Text style={[styles.preferenceTitle, highlighted && styles.preferenceTitleHighlighted]}>
            {title}
          </Text>
          <Text style={styles.preferenceDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
        thumbColor={value ? COLORS.primary : COLORS.white}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  preferenceItemHighlighted: {
    backgroundColor: COLORS.primaryLight + '10',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  preferenceIcon: {
    marginRight: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  preferenceTitleHighlighted: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  preferenceDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  footer: {
    height: 32,
  },
  savingIndicator: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    transform: [{ translateX: -60 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  savingText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
