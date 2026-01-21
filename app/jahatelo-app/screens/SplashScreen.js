import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedSplash from '../components/AnimatedSplash';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function SplashScreen({ navigation }) {
  const didNavigate = useRef(false);

  const checkAgeGateAndNavigate = async () => {
    try {
      // Consultar si el age gate está habilitado
      const response = await fetch(`${API_URL}/api/settings/public`);
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
