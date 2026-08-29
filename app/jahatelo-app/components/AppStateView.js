import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING, TOUCH_TARGET } from '../constants/theme';

export default function AppStateView({ type = 'empty', title, message, actionLabel, onAction }) {
  const isLoading = type === 'loading';
  const icon = type === 'error' ? 'alert-circle-outline' : 'search-outline';

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole={type === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
      accessibilityLabel={[title, message].filter(Boolean).join('. ')}
    >
      {isLoading ? <ActivityIndicator size="large" color={COLORS.primary} /> : <Ionicons name={icon} size={40} color={type === 'error' ? COLORS.error : COLORS.textMuted} />}
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={actionLabel} style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: SPACING.sm },
  title: { marginTop: SPACING.sm, color: COLORS.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  message: { maxWidth: 360, color: COLORS.textLight, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  action: { minHeight: TOUCH_TARGET, marginTop: SPACING.md, justifyContent: 'center', borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl },
  actionText: { color: COLORS.white, fontSize: 15, fontWeight: '800', textAlign: 'center' },
});
