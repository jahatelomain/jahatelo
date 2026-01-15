import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function ContactScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validaciones
    if (!name.trim() || !message.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (name.length < 2 || name.length > 100) {
      Alert.alert('Error', 'El nombre debe tener entre 2 y 100 caracteres');
      return;
    }

    if (message.length < 10 || message.length > 1000) {
      Alert.alert('Error', 'El mensaje debe tener entre 10 y 1000 caracteres');
      return;
    }

    if (phone && phone.length > 50) {
      Alert.alert('Error', 'El teléfono es demasiado largo');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          message: message.trim(),
        }),
      });

      // Verificar si la respuesta es JSON antes de parsear
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Error: respuesta no es JSON', {
          status: response.status,
          contentType,
          url: response.url,
        });
        throw new Error('Error al enviar el mensaje. Intenta nuevamente.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      Alert.alert(
        '¡Mensaje enviado!',
        'Gracias por contactarnos. Nos pondremos en contacto pronto.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar formulario
              setName('');
              setPhone('');
              setMessage('');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'No se pudo enviar el mensaje. Intenta nuevamente.'
      );
      console.error('Error sending contact message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contáctanos</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro */}
          <View style={styles.introContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.introTitle}>¿Tienes alguna pregunta?</Text>
            <Text style={styles.introText}>
              Nos encantaría escucharte. Completa el formulario y nos pondremos en contacto
              pronto.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nombre <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={COLORS.placeholder}
                  value={name}
                  onChangeText={setName}
                  maxLength={100}
                  editable={!loading}
                />
              </View>
              <Text style={styles.helperText}>Mínimo 2 caracteres, máximo 100</Text>
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Teléfono <Text style={styles.optional}>(opcional)</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={COLORS.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="+595 xxx xxx xxx"
                  placeholderTextColor={COLORS.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={50}
                  editable={!loading}
                />
              </View>
              <Text style={styles.helperText}>Opcional. Máximo 50 caracteres</Text>
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Mensaje <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Escribe tu mensaje aquí..."
                  placeholderTextColor={COLORS.placeholder}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={1000}
                  editable={!loading}
                />
              </View>
              <Text style={styles.helperText}>
                Mínimo 10 caracteres. {message.length}/1000
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Enviar mensaje</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Tiempo de respuesta</Text>
                <Text style={styles.infoText}>Respondemos dentro de las 24-48 horas hábiles</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Privacidad</Text>
                <Text style={styles.infoText}>
                  Tus datos están seguros y no serán compartidos
                </Text>
              </View>
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
    backgroundColor: COLORS.backgroundDark,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  introContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  optional: {
    color: COLORS.textLight,
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    minHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 8,
  },
  textArea: {
    height: 100,
    marginLeft: 0,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});
