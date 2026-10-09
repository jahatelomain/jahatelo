import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as authApi from '../services/authApi';
import { COLORS } from '../constants/theme';
import { Modal } from 'react-native';

/**
 * Normaliza cualquier formato de número paraguayo a E.164 (+595XXXXXXXXX)
 * Acepta: 0981123456, 981123456, +595981123456, 595981123456,
 *         0981-123-456, (0981) 123456, +595 981 123 456, etc.
 */
function normalizePyPhone(raw) {
  // Eliminar todo excepto dígitos y +
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (!cleaned) return null;

  let digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  // Si empieza con 595 y tiene 12+ dígitos, quitar prefijo de país
  if (digits.startsWith('595') && digits.length >= 12) {
    digits = digits.slice(3);
  }

  // Quitar cero inicial si existe
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Validar: debe tener 9 dígitos (formato paraguayo sin código de país)
  if (!/^\d{9}$/.test(digits)) return null;

  return `+595${digits}`;
}

export default function WhatsappOtpScreen({ navigation }) {
  const { loginWithOAuth, loginWithSms } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'name'
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [inlineMessage, setInlineMessage] = useState(null);
  const [nickName, setNickName] = useState('');
  const [pendingAuth, setPendingAuth] = useState(null); // { token, user }
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setInlineMessage(null);
    if (!phone.trim()) {
      setInlineMessage({ text: 'Ingresá tu número de teléfono', type: 'error' });
      return;
    }

    const normalizedPhone = normalizePyPhone(phone.trim());
    if (!normalizedPhone) {
      setInlineMessage({ text: 'Número inválido. Formato: 0981 123 456', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const result = await authApi.requestSmsOtp({ phone: normalizedPhone });
      if (result.success) {
        setStep('otp');
        startCooldown();
        setInlineMessage({ text: 'Código enviado ✓ Revisá tus mensajes', type: 'success' });
      } else {
        setInlineMessage({ text: result.error || 'No se pudo enviar el código', type: 'error' });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setInlineMessage({ text: error.message || 'Error al enviar código', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setInlineMessage(null);
    if (!code.trim()) {
      setInlineMessage({ text: 'Ingresá el código recibido', type: 'error' });
      return;
    }
    const normalizedPhone = normalizePyPhone(phone.trim());
    if (!normalizedPhone) {
      setInlineMessage({ text: 'Número inválido. Volvé al paso anterior.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const result = await authApi.verifySmsOtp({
        phone: normalizedPhone,
        code: code.trim(),
      });
      if (result.success && result.token && result.user) {
        await loginWithSms({ token: result.token, user: result.user });
        setPendingAuth({ token: result.token, user: result.user });
        setStep('name');
      } else {
        setInlineMessage({ text: result.error || 'Código inválido o expirado', type: 'error' });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setInlineMessage({ text: error.message || 'Error al verificar código', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipName = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleSubmitName = async () => {
    if (!nickName.trim()) {
      setInlineMessage({ text: 'Ingresá un nombre o apodo', type: 'error' });
      return;
    }
    try {
      setIsLoading(true);
      await authApi.updateProfile({ name: nickName.trim() });
      const profileResult = await authApi.getProfile();
      if (profileResult.success && profileResult.user) {
        await loginWithSms({ token: pendingAuth.token, user: profileResult.user });
      }
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      console.error('Error updating profile:', error);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Logo y Título */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color="#822DE2" />
            </View>
            <Text style={styles.title}>
              {step === 'phone' ? 'Ingresá con SMS' : step === 'otp' ? 'Verificá tu código' : '¡Bienvenido!'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Te enviaremos un código por SMS para iniciar sesión o registrarte'
                : step === 'otp'
                ? `Código enviado a ${phone}`
                : 'Elegí un nombre para personalizar tu experiencia'}
            </Text>
          </View>

          <View style={styles.form}>
            {/* Inline message (replaces invasive popup) */}
            {inlineMessage && (
              <View style={[styles.inlineMessage, inlineMessage.type === 'success' ? styles.inlineSuccess : styles.inlineError]}>
                <Ionicons
                  name={inlineMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={inlineMessage.type === 'success' ? '#166534' : '#991B1B'}
                />
                <Text style={[styles.inlineMessageText, inlineMessage.type === 'success' ? styles.inlineSuccessText : styles.inlineErrorText]}>
                  {inlineMessage.text}
                </Text>
              </View>
            )}

            {step === 'phone' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Número de teléfono</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="0981 123 456"
                      value={phone}
                      onChangeText={(text) => { setPhone(text); setInlineMessage(null); }}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      accessibilityLabel="Número de teléfono"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                  accessibilityRole="button"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Enviar código por SMS</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Código de verificación</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="keypad-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123456"
                      value={code}
                      onChangeText={(text) => { setCode(text); setInlineMessage(null); }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      accessibilityLabel="Código de verificación"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                  accessibilityRole="button"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verificar e ingresar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendOtp}
                  disabled={countdown > 0 || isLoading}
                >
                  <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                    {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setStep('phone'); setCode(''); }}>
                  <Text style={styles.changePhoneText}>Cambiar número</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de nombre/nick */}
      <Modal
        visible={step === 'name'}
        transparent
        animationType="fade"
        onRequestClose={handleSkipName}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="person-outline" size={48} color="#822DE2" />
            </View>
            <Text style={styles.modalTitle}>¿Cómo te llamamos?</Text>
            <Text style={styles.modalSubtitle}>
              Elegí un nombre o apodo para que no tengamos que llamarte por tu número
            </Text>
            <View style={styles.modalInputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Tu nombre o apodo"
                placeholderTextColor={COLORS.gray}
                value={nickName}
                onChangeText={setNickName}
                autoFocus
                maxLength={30}
                accessibilityLabel="Nombre o apodo"
              />
            </View>
            {inlineMessage && step === 'name' && (
              <Text style={styles.modalError}>{inlineMessage.text}</Text>
            )}
            <TouchableOpacity
              style={[styles.modalPrimaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmitName}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.modalPrimaryButtonText}>Continuar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSkipButton}
              onPress={handleSkipName}
              disabled={isLoading}
            >
              <Text style={styles.modalSkipText}>Prefiero usar mi número</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  header: { paddingTop: 8, paddingBottom: 16 },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.grayLight, justifyContent: 'center', alignItems: 'center',
  },
  logoContainer: { alignItems: 'center', paddingVertical: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
  form: { flex: 1 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.grayLight, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayLight,
  },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, color: COLORS.text },
  primaryButton: {
    backgroundColor: '#822DE2', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  resendButton: { alignItems: 'center', marginTop: 16 },
  resendText: { fontSize: 14, fontWeight: '600', color: '#822DE2' },
  resendDisabled: { color: COLORS.gray },
  changePhoneText: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginTop: 12 },
  inlineMessage: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, gap: 8,
  },
  inlineSuccess: { backgroundColor: '#dcfce7' },
  inlineError: { backgroundColor: '#fee2e2' },
  inlineMessageText: { flex: 1, fontSize: 14, lineHeight: 20 },
  inlineSuccessText: { color: '#166534' },
  inlineErrorText: { color: '#991B1B' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 28,
    width: '100%', maxWidth: 400, alignItems: 'center',
  },
  modalIconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalInputWrapper: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: COLORS.grayLight, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayLight,
    marginBottom: 16,
  },
  modalInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, color: COLORS.text },
  modalError: { color: '#991B1B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  modalPrimaryButton: {
    backgroundColor: '#822DE2', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', width: '100%', marginTop: 8,
  },
  modalPrimaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  modalSkipButton: { marginTop: 16, paddingVertical: 8 },
  modalSkipText: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
});