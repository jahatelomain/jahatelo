import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { requestSmsOtp, verifySmsOtp } from '../services/authApi';
import { COLORS } from '../constants/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const isAppleAvailable = Platform.OS === 'ios';
  const [registerMethod, setRegisterMethod] = useState('sms'); // sms | email
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (registerMethod === 'sms') {
      if (!phone.trim()) {
        newErrors.phone = 'El teléfono es requerido';
      }
      if (otpSent && !otpCode.trim()) {
        newErrors.otpCode = 'El código es requerido';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  React.useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const handleSendOtp = async () => {
    if (!validateForm()) return;
    try {
      setOtpLoading(true);
      const data = await requestSmsOtp({ phone: phone.trim() });
      setOtpSent(true);
      setResendSeconds(60);
      if (data?.debugCode) {
        setOtpCode(String(data.debugCode));
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo enviar el código');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateForm()) return;
    try {
      setOtpVerifyLoading(true);
      const result = await verifySmsOtp({
        phone: phone.trim(),
        code: otpCode.trim(),
        name: formData.name.trim() || undefined,
      });

      if (result.success) {
        Alert.alert(
          '¡Cuenta creada!',
          'Tu cuenta ha sido creada exitosamente.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Error al crear cuenta');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al crear cuenta');
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      if (registerMethod === 'sms') {
        if (!otpSent) {
          await handleSendOtp();
          return;
        }
        await handleVerifyOtp();
        return;
      }

      setIsLoading(true);
      const result = await register({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim() || undefined,
      });

      if (result.success) {
        Alert.alert(
          '¡Cuenta creada!',
          'Tu cuenta ha sido creada exitosamente.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Error al crear cuenta');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = () => {
    Alert.alert('Apple', 'Login con Apple pendiente de configuración');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Logo y Título */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="heart" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para guardar favoritos y más</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, registerMethod === 'sms' && styles.toggleButtonActive]}
                onPress={() => {
                  setRegisterMethod('sms');
                  setErrors({});
                  setOtpSent(false);
                  setOtpCode('');
                  setResendSeconds(0);
                  updateField('email', '');
                  updateField('password', '');
                  updateField('confirmPassword', '');
                }}
              >
                <Text style={[styles.toggleText, registerMethod === 'sms' && styles.toggleTextActive]}>
                  SMS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, registerMethod === 'email' && styles.toggleButtonActive]}
                onPress={() => {
                  setRegisterMethod('email');
                  setErrors({});
                  setOtpSent(false);
                  setOtpCode('');
                  setResendSeconds(0);
                  setPhone('');
                }}
              >
                <Text style={[styles.toggleText, registerMethod === 'email' && styles.toggleTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nick (opcional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nick (opcional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nick"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            {registerMethod === 'sms' ? (
              <>
                {/* Teléfono */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Teléfono *</Text>
                  <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                    <Ionicons name="call-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="+595981234567"
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(text);
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      editable={!otpLoading && !otpVerifyLoading}
                    />
                  </View>
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                {otpSent && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Código *</Text>
                    <View style={[styles.inputWrapper, errors.otpCode && styles.inputError]}>
                      <Ionicons name="key-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="000000"
                        value={otpCode}
                        onChangeText={(text) => {
                          setOtpCode(text);
                          if (errors.otpCode) setErrors({ ...errors, otpCode: null });
                        }}
                        keyboardType="number-pad"
                        editable={!otpVerifyLoading}
                      />
                    </View>
                    {errors.otpCode && <Text style={styles.errorText}>{errors.otpCode}</Text>}
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email *</Text>
                  <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChangeText={(text) => updateField('email', text)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Contraseña */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Contraseña *</Text>
                  <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChangeText={(text) => updateField('password', text)}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={COLORS.gray}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Confirmar Contraseña */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmar Contraseña *</Text>
                  <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirma tu contraseña"
                      value={formData.confirmPassword}
                      onChangeText={(text) => updateField('confirmPassword', text)}
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="password"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={COLORS.gray}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>
              </>
            )}

            {/* Botón de Registro */}
            <TouchableOpacity
              style={[styles.registerButton, (isLoading || otpLoading || otpVerifyLoading) && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading || otpLoading || otpVerifyLoading}
            >
              {isLoading || otpLoading || otpVerifyLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>
                  {registerMethod === 'sms'
                    ? (otpSent ? 'Verificar y crear cuenta' : 'Enviar código')
                    : 'Crear Cuenta'}
                </Text>
              )}
            </TouchableOpacity>

            {registerMethod === 'sms' && otpSent && (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleSendOtp}
                disabled={resendSeconds > 0 || otpLoading}
              >
                <Text style={styles.resendText}>
                  {resendSeconds > 0 ? `Reenviar en ${resendSeconds}s` : 'Reenviar código'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Términos */}
            <Text style={styles.termsText}>
              Al registrarte, aceptas nuestros{' '}
              <Text style={styles.termsLink}>Términos y Condiciones</Text> y{' '}
              <Text style={styles.termsLink}>Política de Privacidad</Text>
            </Text>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o regístrate con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth Buttons */}
            <View style={styles.oauthContainer}>
              <TouchableOpacity style={styles.oauthButton}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              {isAppleAvailable && (
                <TouchableOpacity style={styles.oauthButton} onPress={handleAppleLogin}>
                  <Ionicons name="logo-apple" size={24} color="#000" />
                </TouchableOpacity>
              )}
            </View>

            {/* Login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Inicia Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.white,
  },
  toggleText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.text,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  resendText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.grayLight,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.gray,
  },
  oauthContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  oauthButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
