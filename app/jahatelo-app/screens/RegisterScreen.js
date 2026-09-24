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
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, STATUS_COLORS } from '../constants/theme';
import { showMessage } from '../utils/appFeedback';
import { trackVisitor } from '../services/analyticsService';
import { useGoogleAuth } from '../services/googleAuthService';
import { useFacebookAuth, isFacebookLoginEnabled } from '../services/facebookAuthService';

export default function RegisterScreen({ navigation }) {
  const { register, loginWithOAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { request: googleRequest, response: googleResponse, promptAsync: promptGoogleAsync } = useGoogleAuth();
  const { request: facebookRequest, response: facebookResponse, promptAsync: promptFacebookAsync } = useFacebookAuth();

  const closeAfterAuthentication = () => {
    InteractionManager.runAfterInteractions(() => {
      if (navigation.isFocused()) navigation.goBack();
    });
  };

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleRegister(googleResponse.authentication?.idToken || googleResponse.params?.id_token);
    } else if (googleResponse?.type === 'error') {
      showMessage('Error', `No se pudo continuar con Google: ${googleResponse.error?.message || googleResponse.error}`);
    }
  }, [googleResponse]);

  React.useEffect(() => {
    if (facebookResponse?.type === 'success') {
      handleFacebookRegister(facebookResponse.authentication?.accessToken || facebookResponse.params?.access_token);
    } else if (facebookResponse?.type === 'error') {
      showMessage('Error', `No se pudo continuar con Facebook: ${facebookResponse.error?.message || facebookResponse.error}`);
    } else if (facebookResponse?.type === 'locked') {
      showMessage('Error', 'Ya hay una ventana de Facebook abierta. Cerrala e intentá nuevamente.');
    }
  }, [facebookResponse]);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

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

  const handleGoogleRegister = async (idToken) => {
    try {
      setIsLoading(true);
      if (!idToken) {
        showMessage('Error', 'Google no devolvió una credencial válida');
        return;
      }
      const result = await loginWithOAuth({ provider: 'google', idToken });
      if (result.success) {
        trackVisitor('register_complete', 'Register', { method: 'google' });
        showMessage('¡Bienvenido!', 'Sesión iniciada correctamente');
        closeAfterAuthentication();
      } else {
        showMessage('Error', result.error || 'Error al continuar con Google');
      }
    } catch (error) {
      showMessage('Error', error.message || 'Error al continuar con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookRegister = async (accessToken) => {
    try {
      setIsLoading(true);
      if (!accessToken) {
        showMessage('Error', 'Facebook no devolvió una credencial válida');
        return;
      }
      const result = await loginWithOAuth({ provider: 'facebook', accessToken });
      if (result.success) {
        trackVisitor('register_complete', 'Register', { method: 'facebook' });
        showMessage('¡Bienvenido!', 'Sesión iniciada correctamente');
        closeAfterAuthentication();
      } else {
        showMessage('Error', result.error || 'Error al continuar con Facebook');
      }
    } catch (error) {
      showMessage('Error', error.message || 'Error al continuar con Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  const startFacebookRegister = async () => {
    if (!facebookRequest || isLoading) return;

    try {
      const result = await promptFacebookAsync();
      if (result?.type === 'locked') {
        showMessage('Error', 'Ya hay una ventana de Facebook abierta. Cerrala e intentá nuevamente.');
      } else if (result?.type === 'dismiss' || result?.type === 'cancel') {
        console.log('Facebook register dismissed:', result.type);
      } else if (result?.type === 'error') {
        showMessage('Error', result.error?.message || 'No se pudo abrir Facebook');
      }
    } catch (error) {
      console.error('Error opening Facebook register:', error);
      showMessage('Error', error.message || 'No se pudo abrir Facebook');
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const result = await register({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim() || undefined,
      });

      if (result.success) {
        trackVisitor('register_complete', 'Register', { method: 'email' });
        showMessage(
          '¡Cuenta creada!',
          'Te enviamos un correo de verificación. Revisá tu bandeja y hacé clic en el enlace antes de iniciar sesión.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        showMessage('Error', result.error || 'Error al crear cuenta');
      }
    } catch (error) {
      showMessage('Error', error.message || 'Error al crear cuenta');
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
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Creá tu cuenta para guardar favoritos y recibir novedades</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Nick (opcional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nick (opcional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  accessibilityLabel="Nombre o apodo"
                  style={styles.input}
                  placeholder="Tu nick"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  accessibilityLabel="Correo electrónico"
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
                  accessibilityLabel="Contraseña"
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

            {/* Confirmar Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Contraseña *</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  accessibilityLabel="Confirmar contraseña"
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
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
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

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

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
              <TouchableOpacity
                style={[styles.socialButton, !googleRequest && styles.oauthButtonDisabled]}
                onPress={() => promptGoogleAsync()}
                disabled={!googleRequest || isLoading}
              >
                <Ionicons name="logo-google" size={22} color={STATUS_COLORS.google} />
                <Text style={styles.socialButtonText}>Continuar con Google</Text>
              </TouchableOpacity>
              {isFacebookLoginEnabled() && (
                <TouchableOpacity
                  style={[styles.socialButton, !facebookRequest && styles.oauthButtonDisabled]}
                  onPress={startFacebookRegister}
                  disabled={!facebookRequest || isLoading}
                >
                  <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                  <Text style={styles.socialButtonText}>Continuar con Facebook</Text>
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
