import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import {
  clearCache,
  clearSearchHistory,
  getCacheSize,
  formatCacheSize,
  getLastSync,
  getRecentViews,
} from '../services/cacheService';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [cacheSize, setCacheSize] = useState('0 Bytes');
  const [recentViewsCount, setRecentViewsCount] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar información del caché al montar
  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      const [size, recentViews, lastSync] = await Promise.all([
        getCacheSize(),
        getRecentViews(),
        getLastSync(),
      ]);

      setCacheSize(formatCacheSize(size));
      setRecentViewsCount(recentViews.length);
      if (lastSync) {
        setLastSyncDate(new Date(lastSync));
      }
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
  };

  const handleRegisterMotel = () => {
    navigation.navigate('RegisterMotel');
  };

  const handleLegalPress = (title, content) => {
    navigation.navigate('Legal', { title, content });
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar caché',
      '¿Estás seguro de que quieres eliminar todos los datos guardados? Esto incluye moteles guardados, historial de búsquedas y vistos recientemente.\n\nTus favoritos NO serán eliminados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const success = await clearCache();
            if (success) {
              Alert.alert('Éxito', 'Caché limpiado correctamente');
              await loadCacheInfo();
            } else {
              Alert.alert('Error', 'No se pudo limpiar el caché');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleClearSearchHistory = () => {
    Alert.alert(
      'Limpiar historial',
      '¿Deseas eliminar tu historial de búsquedas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            const success = await clearSearchHistory();
            if (success) {
              Alert.alert('Éxito', 'Historial de búsquedas limpiado');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert('Sesión cerrada', 'Has cerrado sesión exitosamente');
          },
        },
      ]
    );
  };

  // Loading state
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {isAuthenticated && user?.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={40} color="#FFFFFF" />
            )}
          </View>

          {isAuthenticated ? (
            <>
              <Text style={styles.headerTitle}>{user?.name || 'Usuario'}</Text>
              <Text style={styles.headerSubtitle}>{user?.email}</Text>

              {/* Stats for authenticated users */}
              {user?.stats && (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={24} color={COLORS.primary} />
                    <Text style={styles.statValue}>{user.stats.favoritesCount || 0}</Text>
                    <Text style={styles.statLabel}>Favoritos</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={24} color={COLORS.primary} />
                    <Text style={styles.statValue}>{user.stats.reviewsCount || 0}</Text>
                    <Text style={styles.statLabel}>Reseñas</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.headerTitle}>Modo invitado</Text>
              <Text style={styles.headerSubtitle}>
                Inicia sesión para sincronizar favoritos y más
              </Text>

              {/* Login/Register buttons for guest */}
              <View style={styles.authButtonsContainer}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Explora Jahatelo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explora Jahatelo</Text>
          <View style={styles.optionsContainer}>
            <OptionRow
              icon="business"
              title="Registrar tu motel"
              onPress={handleRegisterMotel}
            />
          </View>
        </View>

        {/* Cuenta Section (solo para usuarios autenticados) */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu cuenta</Text>
            <View style={styles.optionsContainer}>
              <OptionRow
                icon="notifications-outline"
                title="Notificaciones"
                onPress={() => navigation.navigate('NotificationPreferences')}
              />
            </View>
          </View>
        )}

        {/* Almacenamiento y datos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Almacenamiento y datos</Text>
          <View style={styles.optionsContainer}>
            {/* Info Row - Cache Size */}
            <View style={styles.infoRow}>
              <View style={styles.optionLeft}>
                <Ionicons name="archive-outline" size={24} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.optionTitle}>Datos guardados</Text>
                  <Text style={styles.infoSubtitle}>{cacheSize}</Text>
                </View>
              </View>
            </View>

            {/* Info Row - Recent Views */}
            <View style={styles.infoRow}>
              <View style={styles.optionLeft}>
                <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.optionTitle}>Vistos recientemente</Text>
                  <Text style={styles.infoSubtitle}>
                    {recentViewsCount} {recentViewsCount === 1 ? 'motel' : 'moteles'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Row - Last Sync */}
            {lastSyncDate && (
              <View style={styles.infoRow}>
                <View style={styles.optionLeft}>
                  <Ionicons name="sync-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.optionTitle}>Última sincronización</Text>
                    <Text style={styles.infoSubtitle}>
                      {lastSyncDate.toLocaleString('es-PY', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Row - Clear Search History */}
            <OptionRow
              icon="search-outline"
              title="Limpiar historial de búsquedas"
              onPress={handleClearSearchHistory}
            />

            {/* Action Row - Clear Cache */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleClearCache}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                <Text style={[styles.optionTitle, { color: '#FF6B6B' }]}>
                  Limpiar todos los datos guardados
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal y ayuda Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal y ayuda</Text>
          <View style={styles.optionsContainer}>
            <OptionRow
              icon="mail-outline"
              title="Contáctanos"
              onPress={() => handleLegalPress(
                'Contáctanos',
                'Estamos aquí para ayudarte.\n\nPróximamente compartiremos nuestros canales de contacto para que puedas comunicarte con nosotros.'
              )}
            />
            <OptionRow
              icon="document-text-outline"
              title="Bases y condiciones"
              onPress={() => handleLegalPress(
                'Bases y condiciones',
                'Aquí irán las bases y condiciones de uso de Jahatelo.\n\nPróximamente estarán disponibles los términos completos de servicio.'
              )}
            />
            <OptionRow
              icon="shield-checkmark-outline"
              title="Política de privacidad"
              onPress={() => handleLegalPress(
                'Política de privacidad',
                'Aquí irá la política de privacidad de Jahatelo.\n\nPróximamente estará disponible el detalle completo sobre cómo manejamos tus datos.'
              )}
            />
            <OptionRow
              icon="information-circle-outline"
              title="Sobre Jahatelo"
              onPress={() => handleLegalPress(
                'Sobre Jahatelo',
                'Jahatelo es la plataforma líder para descubrir y reservar moteles en Paraguay.\n\nNuestra misión es facilitar el acceso a información confiable sobre moteles, ayudando a los usuarios a encontrar el lugar perfecto para sus momentos especiales.\n\nVersión: 1.0.0 (MVP)'
              )}
            />
          </View>
        </View>

        {/* Logout Button (only for authenticated users) */}
        {isAuthenticated && (
          <View style={styles.section}>
            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable OptionRow Component
function OptionRow({ icon, title, onPress }) {
  return (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
        <Text style={styles.optionTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
    </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  authButtonsContainer: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  registerButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  optionsContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  footer: {
    height: 32,
  },
});
