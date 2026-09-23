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
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getApiRoot } from '../services/apiBaseUrl';
import { COLORS } from '../constants/theme';
import { useGoogleAuth, isGoogleConfigured } from '../services/googleAuthService';
import { useFacebookAuth, isFacebookConfigured } from '../services/facebookAuthService';
import { showErrorMessage, showSuccessMessage } from '../utils/appFeedback';

export default function LoginScreen({ navigation }) {
  const { login, loginWithOAuth, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendVerifLoading, setResendVerifLoading] = useState(false);

  // El cambio de autenticación vuelve a renderizar Perfil y sus providers.
  // Esperar a que ese commit termine evita desmontar Login dentro de la misma
  // transacción de Fabric, una carrera que provoca SIGSEGV en iOS 26.
  const closeAfterAuthentication = () => {
    InteractionManager.runAfterInteractions(() => {
      if (navigation.isFocused()) navigation.goBack();
    });
  };

  // Google Sign-In
  const { request: googleRequest, response: googleResponse, promptAsync: promptGoogleAsync } = useGoogleAuth();
  const { request: facebookRequest, response: facebookResponse, promptAsync: promptFacebookAsync } = useFacebookAuth();

  // Manejar respuesta de Google OAuth
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleLogin(googleResponse.authentication?.idToken || googleResponse.params?.id_token);
    } else if (googleResponse?.type === 'error') {
      console.error('Google OAuth Error:', googleResponse.error);
      showErrorMessage(`Error al iniciar sesión con Google: ${googleResponse.error?.message || googleResponse.error}`);
    } else if (googleResponse?.type === 'dismiss') {
      console.log('User dismissed login');
    }
  }, [googleResponse]);

  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      handleFacebookLogin(facebookResponse.authentication?.accessToken || facebookResponse.params?.access_token);
    } else if (facebookResponse?.type === 'error') {
      console.error('Facebook OAuth Error:', facebookResponse.error);
      showErrorMessage(`Error al iniciar sesión con Facebook: ${facebookResponse.error?.message || facebookResponse.error}`);
    } else if (facebookResponse?.type === 'locked') {
      showErrorMessage('Ya hay una ventana de Facebook abierta. Cerrala e intentá nuevamente.');
    }
  }, [facebookResponse]);

  const validateForm = () => {
    const newErrors = {};

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

  const handleLogin = async () => {
    if (!validateForm()) return;
    setNeedsVerification(false);

    try {
      setIsLoading(true);
      const result = await login({ email: email.trim(), password });

      if (result.success) {
        closeAfterAuthentication();
      } else if (result.needsVerification) {
        setNeedsVerification(true);
      } else {
        showErrorMessage(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      showErrorMessage(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    try {
      setResendVerifLoading(true);
      const apiBase = getApiRoot().replace('/api/mobile', '');
      const res = await fetch(`${apiBase}/api/auth/email/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        showSuccessMessage('Enviado', 'Revisá tu bandeja de entrada y hacé clic en el enlace de verificación.');
      } else {
        const data = await res.json();
        showErrorMessage(data.error || 'No se pudo enviar el correo');
      }
    } catch {
      showErrorMessage('Error de conexión');
    } finally {
      setResendVerifLoading(false);
    }
  };


  const handleGoogleLogin = async (idToken) => {
    try {
      setIsLoading(true);

      if (!idToken) {
        showErrorMessage('Google no devolvió una credencial válida');
        return;
      }

      // Login con backend de Jahatelo usando OAuth
      const result = await loginWithOAuth({
        provider: 'google',
        idToken,
      });

      if (result.success) {
        showSuccessMessage('¡Bienvenido!', `Hola ${result.user.name || result.user.email}`);
        closeAfterAuthentication();
      } else {
        showErrorMessage(result.error || 'Error al iniciar sesión con Google');
      }
    } catch (error) {
      console.error('Error in handleGoogleLogin:', error);
      showErrorMessage(error.message || 'Error al iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async (accessToken) => {
    try {
      setIsLoading(true);

      if (!accessToken) {
        showErrorMessage('Facebook no devolvió una credencial válida');
        return;
      }

      const result = await loginWithOAuth({
        provider: 'facebook',
        accessToken,
      });

      if (result.success) {
        showSuccessMessage('¡Bienvenido!', `Hola ${result.user.name || result.user.email}`);
        closeAfterAuthentication();
      } else {
        showErrorMessage(result.error || 'Error al iniciar sesión con Facebook');
      }
    } catch (error) {
      console.error('Error in handleFacebookLogin:', error);
      showErrorMessage(error.message || 'Error al iniciar sesión con Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  const startFacebookLogin = async () => {
    if (!facebookRequest || isLoading) return;

    try {
      const result = await promptFacebookAsync();
      if (result?.type === 'locked') {
        showErrorMessage('Ya hay una ventana de Facebook abierta. Cerrala e intentá nuevamente.');
      } else if (result?.type === 'dismiss' || result?.type === 'cancel') {
        console.log('Facebook login dismissed:', result.type);
      } else if (result?.type === 'error') {
        showErrorMessage(result.error?.message || 'No se pudo abrir Facebook');
      }
    } catch (error) {
      console.error('Error opening Facebook login:', error);
      showErrorMessage(error.message || 'No se pudo abrir Facebook');
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
              accessibilityRole="button"
              accessibilityLabel="Volver"
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
            <Text style={styles.subtitle}>Ingresá para guardar favoritos y recibir novedades</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
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
                  accessibilityLabel="Correo electrónico"
                  accessibilityState={{ disabled: isLoading }}
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
                  accessibilityLabel="Contraseña"
                  accessibilityState={{ disabled: isLoading }}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

            {/* Banner de email no verificado */}
            {needsVerification && (
              <View style={styles.verificationBanner}>
                <Ionicons name="mail-outline" size={18} color="#B45309" />
                <Text style={styles.verificationBannerText}>
                  Tu email no está verificado. Revisá tu bandeja de entrada.
                </Text>
                <TouchableOpacity
                  onPress={handleResendVerification}
                  disabled={resendVerifLoading}
                  style={styles.resendVerifButton}
                >
                  <Text style={styles.resendVerifText}>
                    {resendVerifLoading ? 'Enviando...' : 'Reenviar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth Buttons */}
            <View style={styles.oauthContainer}>
              <TouchableOpacity
                style={[styles.socialButton, !googleRequest && styles.oauthButtonDisabled]}
                onPress={() => promptGoogleAsync()}
                disabled={!googleRequest || isLoading}
              >
                <Ionicons name="logo-google" size={22} color="#DB4437" />
                <Text style={styles.socialButtonText}>Continuar con Google</Text>
              </TouchableOpacity>
              {isFacebookConfigured() && (
                <TouchableOpacity
                  style={[styles.socialButton, !facebookRequest && styles.oauthButtonDisabled]}
                  onPress={startFacebookLogin}
                  disabled={!facebookRequest || isLoading}
                >
                  <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                  <Text style={styles.socialButtonText}>Continuar con Facebook</Text>
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
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 12,
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  verificationBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  resendVerifButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#B45309',
    borderRadius: 6,
  },
  resendVerifText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  socialButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
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
