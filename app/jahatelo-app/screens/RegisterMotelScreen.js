import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function RegisterMotelScreen({ navigation }) {
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [motelName, setMotelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async () => {
    // Validación básica
    if (!contactName.trim() || !phone.trim() || !motelName.trim()) {
      Alert.alert('Error', 'Todos los campos son requeridos');
      return;
    }

    if (contactName.trim().length < 2) {
      Alert.alert('Error', 'El nombre de contacto debe tener al menos 2 caracteres');
      return;
    }

    if (phone.replace(/\D/g, '').length < 7) {
      Alert.alert('Error', 'El teléfono debe tener al menos 7 dígitos');
      return;
    }

    if (motelName.trim().length < 2) {
      Alert.alert('Error', 'El nombre del motel debe tener al menos 2 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactName: contactName.trim(),
          phone: phone.trim(),
          motelName: motelName.trim(),
          channel: 'APP',
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
        Alert.alert('Error', 'Error al enviar los datos. Intenta nuevamente.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Limpiar formulario
        setContactName('');
        setPhone('');
        setMotelName('');
        // Mostrar modal de éxito
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', data.error || 'Error al enviar los datos');
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar un motel</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={64} color={COLORS.primary} />
        </View>

        {/* Main Title */}
        <Text style={styles.title}>Registrá tu motel en Jahatelo</Text>

        {/* Description */}
        <Text style={styles.description}>
          Completá los siguientes datos y nos contactaremos en la brevedad posible.
        </Text>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de contacto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor="#999"
              value={contactName}
              onChangeText={setContactName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 0981 123 456"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del motel</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Motel Paradise"
              placeholderTextColor="#999"
              value={motelName}
              onChangeText={setMotelName}
              editable={!loading}
            />
          </View>
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Enviar</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>¡Gracias por tus datos!</Text>
            <Text style={styles.modalMessage}>
              Nos contactaremos en la brevedad posible.{'\n'}¡Gracias!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCloseModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#FAFAFA',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
