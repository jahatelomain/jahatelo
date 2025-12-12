import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../hooks/useFavorites';
import { COLORS } from '../constants/theme';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { favorites } = useFavorites();

  const handleRegisterMotel = () => {
    navigation.navigate('RegisterMotel');
  };

  const handleLegalPress = (title, content) => {
    navigation.navigate('Legal', { title, content });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Modo invitado</Text>
          <Text style={styles.headerSubtitle}>
            Tus favoritos se guardan en este dispositivo.{'\n'}
            Más adelante podrás crear una cuenta.
          </Text>
        </View>

        {/* Tu cuenta Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu cuenta</Text>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              Actualmente tienes {favorites.length} {favorites.length === 1 ? 'motel guardado' : 'moteles guardados'} en favoritos.
            </Text>
          </View>
        </View>

        {/* Explora Jahatelo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explora Jahatelo</Text>
          <View style={styles.optionsContainer}>
            <OptionRow
              icon="business"
              title="Registrar tu motel"
              onPress={handleRegisterMotel}
            />
          </View>
        </View>

        {/* Legal y ayuda Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal y ayuda</Text>
          <View style={styles.optionsContainer}>
            <OptionRow
              icon="mail-outline"
              title="Contáctanos"
              onPress={() => handleLegalPress(
                'Contáctanos',
                'Estamos aquí para ayudarte.\n\nPróximamente compartiremos nuestros canales de contacto para que puedas comunicarte con nosotros.'
              )}
            />
            <OptionRow
              icon="document-text-outline"
              title="Bases y condiciones"
              onPress={() => handleLegalPress(
                'Bases y condiciones',
                'Aquí irán las bases y condiciones de uso de Jahatelo.\n\nPróximamente estarán disponibles los términos completos de servicio.'
              )}
            />
            <OptionRow
              icon="shield-checkmark-outline"
              title="Política de privacidad"
              onPress={() => handleLegalPress(
                'Política de privacidad',
                'Aquí irá la política de privacidad de Jahatelo.\n\nPróximamente estará disponible el detalle completo sobre cómo manejamos tus datos.'
              )}
            />
            <OptionRow
              icon="information-circle-outline"
              title="Sobre Jahatelo"
              onPress={() => handleLegalPress(
                'Sobre Jahatelo',
                'Jahatelo es la plataforma líder para descubrir y reservar moteles en Paraguay.\n\nNuestra misión es facilitar el acceso a información confiable sobre moteles, ayudando a los usuarios a encontrar el lugar perfecto para sus momentos especiales.\n\nVersión: 1.0.0 (MVP)'
              )}
            />
          </View>
        </View>

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable OptionRow Component
function OptionRow({ icon, title, onPress }) {
  return (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
        <Text style={styles.optionTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  optionsContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  footer: {
    height: 32,
  },
});
