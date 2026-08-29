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
import { recommendMotel } from '../services/catalogFeedbackApi';
import { getUserFacingNetworkError } from '../utils/networkError';
import { showErrorMessage, showSuccessMessage, showValidationMessage } from '../utils/appFeedback';

export default function RecommendMotelScreen({ route, navigation }) {
  const [motelName, setMotelName] = useState(route?.params?.motelName || '');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const normalizedName = motelName.trim();
    const normalizedCity = city.trim();

    if (normalizedName.length < 2 || normalizedCity.length < 2) {
      showValidationMessage('Completá el nombre del motel y la ciudad.');
      return;
    }

    setSubmitting(true);
    try {
      await recommendMotel({ motelName: normalizedName, city: normalizedCity });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccessMessage(
        '¡Gracias!',
        'Revisaremos tu recomendación.',
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
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recomendar un motel</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="location" size={36} color={COLORS.primary} />
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={15} color={COLORS.white} />
            </View>
          </View>

          <Text style={styles.title}>¿Qué motel nos falta?</Text>
          <Text style={styles.description}>
            Pasanos estos dos datos y nuestro equipo revisará la recomendación.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Nombre del motel</Text>
            <TextInput
              accessibilityLabel="Nombre del motel"
              accessibilityHint="Ingresá el nombre del lugar que querés recomendar"
              style={styles.input}
              value={motelName}
              onChangeText={setMotelName}
              placeholder="Ej.: Motel Paraíso"
              placeholderTextColor={COLORS.textMuted}
              editable={!submitting}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={100}
            />

            <Text style={[styles.label, styles.secondLabel]}>Ciudad</Text>
            <TextInput
              accessibilityLabel="Ciudad"
              accessibilityHint="Ingresá la ciudad donde se encuentra el motel"
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ej.: Asunción"
              placeholderTextColor={COLORS.textMuted}
              editable={!submitting}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              maxLength={100}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Enviar recomendación"
            accessibilityState={{ disabled: submitting, busy: submitting }}
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="send" size={18} color={COLORS.white} />
                <Text style={styles.submitText}>Enviar recomendación</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  keyboardView: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerSpacer: { width: 40 },
  content: { padding: 24, paddingBottom: 40 },
  iconWrap: {
    alignSelf: 'center',
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    backgroundColor: COLORS.accentLight,
    marginTop: 14,
    marginBottom: 20,
  },
  plusBadge: {
    position: 'absolute',
    right: 5,
    bottom: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  description: {
    marginTop: 10,
    marginBottom: 28,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorderSoft,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '700', color: COLORS.text },
  secondLabel: { marginTop: 18 },
  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBackground,
    color: COLORS.text,
    fontSize: 16,
  },
  submitButton: {
    minHeight: 54,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.65 },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
