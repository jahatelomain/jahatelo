import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';

export default function MotelHeader({ motel, onCall, onWhatsApp, onShare }) {
  const phone = motel.contact?.phone;
  const whatsapp = motel.contact?.whatsapp;

  return (
    <Animated.View entering={SlideInUp.delay(100).duration(500).springify()} style={styles.header}>
      <View style={styles.headerInfo}>
        <Text style={styles.motelName} numberOfLines={1}>{motel.nombre}</Text>
        <Text style={styles.motelLocation} numberOfLines={1}>{motel.ciudad}</Text>
      </View>

      <View style={styles.contactButtons}>
        <TouchableOpacity
          style={[styles.contactButton, !phone && styles.contactButtonDisabled]}
          onPress={phone ? () => onCall(phone) : undefined}
          activeOpacity={0.7}
          disabled={!phone}
        >
          <Ionicons
            name="call"
            size={16}
            color={phone ? COLORS.primary : COLORS.muted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactButton, !whatsapp && styles.contactButtonDisabled]}
          onPress={whatsapp ? () => onWhatsApp(whatsapp) : undefined}
          activeOpacity={0.7}
          disabled={!whatsapp}
        >
          <Ionicons
            name="logo-whatsapp"
            size={16}
            color={whatsapp ? '#25D366' : COLORS.muted}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} onPress={onShare} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  headerInfo: {
    flex: 1,
  },
  motelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A0038',
  },
  motelLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
});
