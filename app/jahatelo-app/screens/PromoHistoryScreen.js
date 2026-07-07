import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Clipboard,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

const CLAIMED_CODES_KEY = 'jahatelo_claimed_promo_codes';

export default function PromoHistoryScreen({ navigation }) {
  const [codes, setCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);

  const loadCodes = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CLAIMED_CODES_KEY);
      const map = raw ? JSON.parse(raw) : {};
      // Convertir mapa { promoId: codeData } a array
      const list = Object.entries(map).map(([promoId, data]) => ({ promoId, ...data }));
      setCodes(list);
    } catch {
      setCodes([]);
    }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleCopy = (code) => {
    Clipboard.setString(code);
    Alert.alert('¡Copiado!', 'El código fue copiado al portapapeles.');
  };

  const handleDelete = (promoId) => {
    Alert.alert(
      'Eliminar código',
      '¿Querés eliminar este código de tu historial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const raw = await AsyncStorage.getItem(CLAIMED_CODES_KEY);
              const map = raw ? JSON.parse(raw) : {};
              delete map[promoId];
              await AsyncStorage.setItem(CLAIMED_CODES_KEY, JSON.stringify(map));
              setCodes(prev => prev.filter(c => c.promoId !== promoId));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el código');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedCode(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <Ionicons name="ticket-outline" size={24} color={COLORS.primary} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardCode}>{item.code}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item.promoId)}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color="#dc2626" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis códigos de promo</Text>
        <View style={{ width: 40 }} />
      </View>

      {codes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={56} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Sin códigos guardados</Text>
          <Text style={styles.emptySubtitle}>
            Los códigos que obtengas en las promociones aparecerán acá.
          </Text>
        </View>
      ) : (
        <FlatList
          data={codes}
          keyExtractor={(item) => item.promoId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de código seleccionado */}
      <Modal
        visible={!!selectedCode}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedCode?.title}</Text>
            {selectedCode?.description ? (
              <Text style={styles.modalDescription}>{selectedCode.description}</Text>
            ) : null}
            <Text style={styles.modalCodeLabel}>Tu código de descuento</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{selectedCode?.code}</Text>
            </View>
            <Text style={styles.codeHint}>Mostrá este código al llegar al motel</Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => { handleCopy(selectedCode?.code); setSelectedCode(null); }}
              activeOpacity={0.8}
            >
              <Text style={styles.copyBtnText}>Copiar código</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedCode(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>Cerrar</Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A0038',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0E6F5',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A0038',
    marginBottom: 4,
  },
  cardCode: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A0038',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6A5E6E',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A0038',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6A5E6E',
    textAlign: 'center',
  },
  modalCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C8BA5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  codeBox: {
    backgroundColor: '#F5E6FA',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 6,
    fontFamily: 'monospace',
  },
  codeHint: {
    fontSize: 13,
    color: '#9C8BA5',
    textAlign: 'center',
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  closeBtn: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#9C8BA5',
    fontSize: 14,
    fontWeight: '600',
  },
});
