import React, { useState, useEffect } from 'react';
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
import { useGoogleAuth, getGoogleUserInfo, isGoogleConfigured } from '../services/googleAuthService';

export default function LoginScreen({ navigation }) {
  const { login, loginWithOAuth, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState('email'); // email | sms
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const isAppleAvailable = Platform.OS === 'ios';

  // Google Sign-In
  const { request: googleRequest, response: googleResponse, promptAsync: promptGoogleAsync } = useGoogleAuth();

  // Manejar respuesta de Google OAuth
  useEffect(() => {
    console.log('Google Response:', googleResponse);
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      handleGoogleLogin(authentication.accessToken);
    } else if (googleResponse?.type === 'error') {
      console.error('Google OAuth Error:', googleResponse.error);
      Alert.alert('Error', `Error al iniciar sesión con Google: ${googleResponse.error?.message || googleResponse.error}`);
    } else if (googleResponse?.type === 'dismiss') {
      console.log('User dismissed login');
    }
  }, [googleResponse]);

  const validateForm = () => {
    const newErrors = {};

    if (loginMethod === 'sms') {
      if (!phone.trim()) {
        newErrors.phone = 'El teléfono es requerido';
      }
      if (otpSent && !otpCode.trim()) {
        newErrors.otpCode = 'El código es requerido';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const result = await login({ email: email.trim(), password });

      if (result.success) {
        // La navegación se manejará automáticamente por el estado de autenticación
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

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
        name: otpName.trim() || undefined,
      });
      if (result?.success) {
        Alert.alert('¡Bienvenido!', 'Sesión iniciada correctamente');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Código inválido');
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  const handleAppleLogin = () => {
    Alert.alert('Apple', 'Login con Apple pendiente de configuración');
  };

  const handleGoogleLogin = async (accessToken) => {
    try {
      setIsLoading(true);

      // Obtener info del usuario de Google
      const userInfo = await getGoogleUserInfo(accessToken);
      if (!userInfo) {
        Alert.alert('Error', 'No se pudo obtener información de Google');
        return;
      }

      // Login con backend de Jahatelo usando OAuth
      const result = await loginWithOAuth({
        provider: 'google',
        providerId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
      });

      if (result.success) {
        Alert.alert('¡Bienvenido!', `Hola ${userInfo.name || userInfo.email}`);
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Error al iniciar sesión con Google');
      }
    } catch (error) {
      console.error('Error in handleGoogleLogin:', error);
      Alert.alert('Error', error.message || 'Error al iniciar sesión con Google');
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
            <Text style={styles.title}>Bienvenido a Jahatelo</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, loginMethod === 'email' && styles.toggleButtonActive]}
                onPress={() => {
                  setLoginMethod('email');
                  setErrors({});
                  setOtpSent(false);
                  setOtpCode('');
                  setOtpName('');
                  setResendSeconds(0);
                }}
              >
                <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, loginMethod === 'sms' && styles.toggleButtonActive]}
                onPress={() => {
                  setLoginMethod('sms');
                  setErrors({});
                  setEmail('');
                  setPassword('');
                  setOtpSent(false);
                  setOtpCode('');
                  setOtpName('');
                  setResendSeconds(0);
                }}
              >
                <Text style={[styles.toggleText, loginMethod === 'sms' && styles.toggleTextActive]}>
                  SMS
                </Text>
              </TouchableOpacity>
            </View>

            {loginMethod === 'email' ? (
              <>
                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="tu@email.com"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
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
                  <Text style={styles.label}>Contraseña</Text>
                  <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) setErrors({ ...errors, password: null });
                      }}
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

                {/* Botón de Login */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Teléfono */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Número de teléfono</Text>
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
                      editable={!otpLoading && !otpVerifyLoading}
                    />
                  </View>
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                {otpSent && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Código</Text>
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

                {otpSent && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nombre (opcional)</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Tu nombre"
                        value={otpName}
                        onChangeText={setOtpName}
                        editable={!otpVerifyLoading}
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.loginButton, (otpLoading || otpVerifyLoading) && styles.loginButtonDisabled]}
                  onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                  disabled={otpLoading || otpVerifyLoading}
                >
                  {otpLoading || otpVerifyLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {otpSent ? 'Verificar e ingresar' : 'Enviar código'}
                    </Text>
                  )}
                </TouchableOpacity>

                {otpSent && (
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
              </>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth Buttons */}
            <View style={styles.oauthContainer}>
              <TouchableOpacity
                style={[styles.oauthButton, !googleRequest && styles.oauthButtonDisabled]}
                onPress={() => promptGoogleAsync()}
                disabled={!googleRequest || isLoading}
              >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              {isAppleAvailable && (
                <TouchableOpacity
                  style={[styles.oauthButton, isLoading && styles.oauthButtonDisabled]}
                  onPress={handleAppleLogin}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-apple" size={24} color="#000" />
                </TouchableOpacity>
              )}
            </View>

            {/* Registro */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Regístrate</Text>
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
    paddingVertical: 32,
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
    marginBottom: 20,
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
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
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
  oauthButtonDisabled: {
    opacity: 0.4,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  registerText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  registerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
