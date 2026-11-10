import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  clearStoredStagingCredentials,
  installStagingFetchInterceptor,
  isStagingEnvironment,
  loadStoredStagingCredentials,
  setStagingCredentials,
} from '../services/stagingAuthService';

export default function StagingAuthGate({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authReady, setAuthReady] = useState(!isStagingEnvironment());
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      if (__DEV__) console.log('🚀 [STAGING] Inicializando autenticación...');
      installStagingFetchInterceptor();

      if (!isStagingEnvironment()) {
        if (__DEV__) console.log('✅ [STAGING] Entorno NO es staging, saltando auth');
        setAuthChecked(true);
        return;
      }

      if (__DEV__) console.log('🔐 [STAGING] Entorno ES staging, cargando credenciales...');
      const hasStored = await loadStoredStagingCredentials();
      if (hasStored) {
        if (__DEV__) console.log('✅ [STAGING] Credenciales cargadas, app lista');
      } else {
        if (__DEV__) console.log('⚠️  [STAGING] NO hay credenciales guardadas, mostrar popup');
      }
      setAuthReady(hasStored);
      setAuthChecked(true);
      if (__DEV__) console.log('🎯 [STAGING] Inicialización completa, authReady:', hasStored);
    };
    init();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (isStagingEnvironment() && !authReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authChecked, authReady]);

  const validate = async () => {
    if (!user.trim() || !pass.trim()) {
      setError('Ingresá usuario y contraseña.');
      return;
    }
    if (__DEV__) console.log('🔐 [STAGING] Usuario ingresó credenciales, guardando...');
    setLoading(true);
    setError('');
    try {
      await setStagingCredentials(user.trim(), pass, true);
      if (__DEV__) console.log('✅ [STAGING] Credenciales guardadas, habilitando app');
      setAuthReady(true);
    } catch (err) {
      console.error('❌ [STAGING] Error al guardar credenciales:', err);
      await clearStoredStagingCredentials();
      setError('No se pudo guardar credenciales de staging.');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <View style={styles.root}>
        <SafeAreaProvider>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#822DE2" />
            <Text style={styles.loadingText}>Inicializando app...</Text>
          </View>
        </SafeAreaProvider>
      </View>
    );
  }

  if (isStagingEnvironment() && !authReady) {
    return (
      <View style={styles.root}>
        <SafeAreaProvider>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.screen}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Acceso Staging</Text>
              <Text style={styles.subtitle}>Ingresá credenciales para continuar</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                contextMenuHidden={false}
                selectTextOnFocus
                placeholder="Usuario"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={user}
                onChangeText={setUser}
              />
              <View style={styles.passwordRow}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  contextMenuHidden={false}
                  selectTextOnFocus
                  secureTextEntry={!showPass}
                  placeholder="Contraseña"
                  placeholderTextColor="#9CA3AF"
                  style={styles.passwordInput}
                  value={pass}
                  onChangeText={setPass}
                  textContentType="password"
                  importantForAutofill="yes"
                  enablesReturnKeyAutomatically={false}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={styles.passwordToggle}
                  onPress={() => setShowPass((prev) => !prev)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPass ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.button}
                onPress={validate}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Entrar al entorno staging"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaProvider>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#F4F4F5', justifyContent: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: '#111827' },
  passwordRow: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, overflow: 'hidden' },
  passwordInput: { flex: 1, paddingVertical: 12, color: '#111827' },
  passwordToggle: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F9FAFB', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' },
  passwordToggleText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  button: { marginTop: 6, backgroundColor: '#822DE2', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  error: { color: '#DC2626', fontSize: 13 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', gap: 10 },
  loadingText: { color: '#6B7280' },
});