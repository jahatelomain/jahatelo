import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../hooks/useFavorites';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { favorites } = useFavorites();

  const handleNavigateToFavorites = () => {
    navigation.navigate('Favoritos');
  };

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
              icon="heart"
              title="Ver favoritos"
              onPress={handleNavigateToFavorites}
            />
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
        <Ionicons name={icon} size={24} color="#FF2E93" />
        <Text style={styles.optionTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF2E93',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A0038',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A0038',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF2E93',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F0F0F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#2A0038',
    marginLeft: 12,
  },
  footer: {
    height: 32,
  },
});
