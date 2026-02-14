import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import AnimatedSplash from '../components/AnimatedSplash';
import { getApiRoot } from '../services/apiBaseUrl';

const API_URL = getApiRoot();

export default function SplashScreen({ navigation }) {
  const didNavigate = useRef(false);

  // Ocultar el splash nativo en este punto: AnimatedSplash ya está montado y listo.
  // Al llamarlo aquí (y no en App.js) se elimina el flash blanco entre el splash
  // nativo estático y la animación Lottie.
  useEffect(() => {
    ExpoSplashScreen.hideAsync();
  }, []);

  const checkAgeGateAndNavigate = async () => {
    try {
      const apiRoot = getApiRoot();
      if (__DEV__) {
        console.log('🌐 API root (Splash):', apiRoot);
      }
      // Consultar si el age gate está habilitado
      const response = await fetch(`${apiRoot}/api/settings/public`);
      const data = await response.json();

      // Si el age gate está habilitado, navegar a AgeGate
      if (data.settings?.age_gate_enabled) {
        navigation.replace('AgeGate');
      } else {
        // Si no está habilitado, ir directo a Main
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Error fetching age gate settings:', error);
      // En caso de error, ir directo a Main
      navigation.replace('Main');
    }
  };

  const goNext = () => {
    if (didNavigate.current) return;
    didNavigate.current = true;
    checkAgeGateAndNavigate();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      goNext();
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AnimatedSplash onFinish={goNext} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
