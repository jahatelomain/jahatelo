import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterMotelScreen({ navigation }) {
  const handleSendRequest = () => {
    const email = 'contacto@jahatelo.app';
    const subject = 'Solicitud de registro de motel';
    const body = 'Hola equipo de Jahatelo,\n\nQuiero registrar mi motel en la plataforma.\n\nDatos del motel:\n- Nombre:\n- Dirección:\n- Teléfono:\n- Email:\n\nQuedo atento a sus indicaciones.\n\nSaludos.';

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailtoUrl).catch((err) => {
      console.error('Error al abrir cliente de email:', err);
      alert('No se pudo abrir el cliente de email. Por favor, contacta a contacto@jahatelo.app manualmente.');
    });
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
          <Ionicons name="arrow-back" size={24} color="#2A0038" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar tu motel</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={64} color="#FF2E93" />
        </View>

        {/* Main Title */}
        <Text style={styles.title}>Suma tu motel a Jahatelo</Text>

        {/* Description */}
        <Text style={styles.description}>
          Jahatelo es la plataforma líder para visibilizar moteles en Paraguay.
          Si tenés un motel y querés aparecer en nuestra app, estamos para ayudarte.
        </Text>

        {/* What we need section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>¿Qué información necesitamos?</Text>
          <View style={styles.infoList}>
            <InfoItem text="Nombre y ubicación del motel" />
            <InfoItem text="Tipos de habitaciones disponibles" />
            <InfoItem text="Precios y tarifas" />
            <InfoItem text="Amenities y servicios" />
            <InfoItem text="Fotos de alta calidad" />
            <InfoItem text="Menú de bebidas y alimentos (si aplica)" />
            <InfoItem text="Datos de contacto" />
          </View>
        </View>

        {/* Process section */}
        <View style={styles.processSection}>
          <Text style={styles.processTitle}>Proceso de registro</Text>
          <Text style={styles.processText}>
            En esta versión MVP, el registro se realiza de forma manual.
            Nuestro equipo te contactará para coordinar la carga de información
            y verificar los datos de tu establecimiento.
          </Text>
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSendRequest}
          activeOpacity={0.8}
        >
          <Ionicons name="mail" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Enviar solicitud</Text>
        </TouchableOpacity>

        {/* Additional info */}
        <Text style={styles.footerText}>
          Te responderemos a la brevedad para comenzar el proceso de registro.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable InfoItem Component
function InfoItem({ text }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name="checkmark-circle" size={20} color="#FF2E93" />
      <Text style={styles.infoItemText}>{text}</Text>
    </View>
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
    color: '#2A0038',
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
    color: '#2A0038',
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
  infoSection: {
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A0038',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItemText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  processSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  processTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A0038',
    marginBottom: 12,
  },
  processText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#FF2E93',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#FF2E93',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
