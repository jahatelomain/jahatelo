import React, { useEffect, useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { fetchAppUpdateConfig, trackAppUpdateAction } from '../services/appUpdateService';
import { compareVersions } from '../utils/version';

export default function AppUpdateModal() {
  const [config, setConfig] = useState(null);
  const [checking, setChecking] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    fetchAppUpdateConfig()
      .then((nextConfig) => {
        const required = compareVersions(currentVersion, nextConfig.minimumVersion) < 0;
        const recommended = compareVersions(currentVersion, nextConfig.recommendedVersion) < 0;
        if (required || recommended) {
          const resolved = { ...nextConfig, required };
          setConfig(resolved);
          trackAppUpdateAction('SHOWN', resolved);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [currentVersion]);

  if (checking || !config || dismissed) return null;

  const storeUrl = Platform.OS === 'ios' ? config.iosStoreUrl : config.androidStoreUrl;
  const update = async () => {
    trackAppUpdateAction('UPDATE_TAPPED', config);
    if (storeUrl) await Linking.openURL(storeUrl);
  };
  const dismiss = () => {
    if (config.required) return;
    trackAppUpdateAction('DISMISSED', config);
    setDismissed(true);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityRole="alert">
          <View style={styles.iconWrap}>
            <Ionicons name="arrow-up-circle-outline" size={38} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>{config.required ? 'Actualización necesaria' : 'Hay una nueva versión'}</Text>
          <Text style={styles.message}>{config.message}</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={update} disabled={!storeUrl}>
            <Text style={styles.primaryText}>{storeUrl ? 'Actualizar ahora' : 'Disponible próximamente'}</Text>
          </TouchableOpacity>
          {!config.required && (
            <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={dismiss}>
              <Text style={styles.secondaryText}>Ahora no</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15, 10, 25, 0.66)' },
  card: { borderRadius: 24, padding: 24, backgroundColor: COLORS.white, alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accentLight },
  title: { marginTop: 18, fontSize: 23, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  message: { marginTop: 10, marginBottom: 24, fontSize: 15, lineHeight: 22, color: COLORS.textLight, textAlign: 'center' },
  primaryButton: { minHeight: 52, width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.primary },
  primaryText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  secondaryButton: { minHeight: 48, marginTop: 8, width: '100%', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
