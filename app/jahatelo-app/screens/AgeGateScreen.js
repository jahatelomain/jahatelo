import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOUCH_TARGET } from '../constants/theme';

export default function AgeGateScreen({ navigation }) {
  const handleEnter = () => {
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Contenido +18</Text>
        <Text style={styles.text}>
          Jahatelo es una app para mayores de 18 años. Entrando confirmás que sos mayor de edad.
        </Text>

        <TouchableOpacity
 style={styles.buttonPrimary}
 onPress={handleEnter}
 accessibilityRole="button"
 accessibilityLabel="Confirmar que soy mayor de 18 años y entrar"
 >
          <Text style={styles.buttonText}>Tengo +18, entrar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A0038',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonPrimary: {
   backgroundColor: '#FF2E93',
   paddingVertical: 12,
   paddingHorizontal: 24,
   borderRadius: 999,
   minHeight: TOUCH_TARGET,
   alignItems: 'center',
   justifyContent: 'center',
   },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
