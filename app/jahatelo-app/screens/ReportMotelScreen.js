import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/theme';
import { reportMotel } from '../services/catalogFeedbackApi';
import { getUserFacingNetworkError } from '../utils/networkError';
import { showErrorMessage, showSuccessMessage, showValidationMessage } from '../utils/appFeedback';

const REASONS = [
  { value: 'PRICE', label: 'Precio incorrecto', icon: 'cash-outline' },
  { value: 'PHOTO', label: 'Foto incorrecta', icon: 'image-outline' },
  { value: 'LOCATION_OR_CONTACT', label: 'Ubicación o contacto', icon: 'location-outline' },
  { value: 'CLOSED', label: 'Motel cerrado', icon: 'close-circle-outline' },
  { value: 'INFORMATION', label: 'Información incorrecta', icon: 'document-text-outline' },
  { value: 'OTHER', label: 'Otro', icon: 'ellipsis-horizontal' },
];

export default function ReportMotelScreen({ route, navigation }) {
  const { motelId, motelName } = route.params || {};
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      showValidationMessage('Indicá qué información debemos revisar.');
      return;
    }

    setSubmitting(true);
    try {
      await reportMotel({ motelId, reason, comment: comment.trim() });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccessMessage(
        'Reporte enviado',
        'Gracias por ayudarnos a mantener la información actualizada.',
        () => navigation.goBack(),
      );
    } catch (error) {
      showErrorMessage(getUserFacingNetworkError(error, 'Intentá nuevamente en unos minutos.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportar información</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.introIcon}>
            <Ionicons name="warning-outline" size={34} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>¿Qué debemos revisar?</Text>
          <Text style={styles.subtitle}>{motelName || 'Este motel'}</Text>

          <View style={styles.reasonsGrid}>
            {REASONS.map((item) => {
              const selected = reason === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  accessibilityRole="radio"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  style={[styles.reasonButton, selected && styles.reasonButtonSelected]}
                  onPress={() => setReason(item.value)}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon} size={21} color={selected ? COLORS.primary : COLORS.textLight} />
                  <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Contanos qué debemos corregir (opcional)</Text>
          <TextInput
            accessibilityLabel="Comentario opcional"
            accessibilityHint="Podés agregar detalles que ayuden a verificar el reporte"
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Agregá cualquier detalle que nos ayude a verificarlo"
            placeholderTextColor={COLORS.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={1000}
            editable={!submitting}
          />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Enviar reporte"
            accessibilityState={{ disabled: submitting, busy: submitting }}
            style={[styles.submitButton, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Enviar reporte</Text>}
          </TouchableOpacity>
          <Text style={styles.privacyText}>No compartiremos tus datos con el motel.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  keyboardView: { flex: 1 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: COLORS.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerSpacer: { width: 40 },
  content: { padding: 22, paddingBottom: 40 },
  introIcon: { alignSelf: 'center', width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accentLight, marginTop: 6 },
  title: { marginTop: 16, fontSize: 25, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  subtitle: { marginTop: 5, marginBottom: 24, fontSize: 15, color: COLORS.textLight, textAlign: 'center' },
  reasonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reasonButton: { width: '48%', minHeight: 68, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: COLORS.cardBorderSoft, backgroundColor: COLORS.white },
  reasonButtonSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.accentLight },
  reasonText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600', color: COLORS.textLight },
  reasonTextSelected: { color: COLORS.text },
  label: { marginTop: 24, marginBottom: 9, fontSize: 14, fontWeight: '700', color: COLORS.text },
  commentInput: { minHeight: 112, padding: 14, borderRadius: 15, borderWidth: 1, borderColor: COLORS.inputBorder, backgroundColor: COLORS.white, color: COLORS.text, fontSize: 15, lineHeight: 21 },
  submitButton: { minHeight: 54, marginTop: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: COLORS.primary },
  disabled: { opacity: 0.65 },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  privacyText: { marginTop: 13, fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
});
