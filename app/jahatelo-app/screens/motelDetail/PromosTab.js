import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Clipboard,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/theme';
import { getApiRoot } from '../../services/apiBaseUrl';
import { getOrCreateDeviceId } from '../../services/analyticsService';

const CLAIMED_CODES_KEY = 'jahatelo_claimed_promo_codes';

async function loadClaimedCodes() {
  try {
    const raw = await AsyncStorage.getItem(CLAIMED_CODES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveClaimedCode(promoId, codeData) {
  try {
    const existing = await loadClaimedCodes();
    existing[promoId] = codeData;
    await AsyncStorage.setItem(CLAIMED_CODES_KEY, JSON.stringify(existing));
  } catch {
    // ignorar errores de storage
  }
}

export default function PromosTab({ route }) {
  const { motel } = route.params || {};
  const promos = motel?.promos || [];

  const [claimLoading, setClaimLoading] = useState(null); // promoId | null
  const [codeModal, setCodeModal] = useState(null); // { code, title, description, imageUrl } | null
  const [claimError, setClaimError] = useState({}); // { [promoId]: string }
  // Mapa de códigos ya reclamados: { [promoId]: { code, title, description, imageUrl } }
  const [claimedCodes, setClaimedCodes] = useState({});

  useEffect(() => {
    loadClaimedCodes().then(setClaimedCodes);
  }, []);

  const handleClaim = useCallback(async (promo) => {
    // Si ya tenemos el código localmente, mostrar directo
    if (claimedCodes[promo.id]) {
      setCodeModal(claimedCodes[promo.id]);
      return;
    }

    setClaimLoading(promo.id);
    setClaimError((prev) => ({ ...prev, [promo.id]: null }));
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await fetch(`${getApiRoot()}/api/public/promos/${promo.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimError((prev) => ({ ...prev, [promo.id]: data.error || 'Error al obtener código' }));
        return;
      }
      const codeData = {
        code: data.code,
        title: data.promoTitle || promo.title,
        description: data.promoDescription || promo.description,
        imageUrl: data.promoImageUrl || promo.imageUrl,
        validUntil: data.promoValidUntil || promo.validUntil || null,
        status: 'PENDING',
      };
      // Persistir localmente
      await saveClaimedCode(promo.id, codeData);
      setClaimedCodes((prev) => ({ ...prev, [promo.id]: codeData }));
      setCodeModal(codeData);
    } catch {
      setClaimError((prev) => ({ ...prev, [promo.id]: 'Error de conexión' }));
    } finally {
      setClaimLoading(null);
    }
  }, [claimedCodes]);

  const handleCopy = () => {
    if (codeModal?.code) {
      Clipboard.setString(codeModal.code);
      Alert.alert('¡Copiado!', 'El código fue copiado al portapapeles.');
    }
  };

  if (!promos.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Sin promociones activas</Text>
        <Text style={styles.emptySubtitle}>
          Cuando este motel publique una promo, la vas a ver acá.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {promos.map((promo) => {
          const alreadyClaimed = !!claimedCodes[promo.id];
          return (
            <View key={promo.id} style={styles.card}>
              {promo.imageUrl ? (
                <Image source={{ uri: promo.imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.imagePlaceholderText}>Promo</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{promo.title}</Text>
                  {promo.isGlobal && (
                    <View style={styles.globalBadge}>
                      <Text style={styles.globalBadgeText}>Home</Text>
                    </View>
                  )}
                </View>
                {promo.description ? (
                  <Text style={styles.description}>{promo.description}</Text>
                ) : (
                  <Text style={styles.descriptionMuted}>Sin descripción</Text>
                )}
                {(promo.validFrom || promo.validUntil) && (
                  <Text style={styles.validity}>
                    Vigente {promo.validFrom ? `desde ${new Date(promo.validFrom).toLocaleDateString('es-PY')}` : ''}
                    {promo.validUntil ? ` hasta ${new Date(promo.validUntil).toLocaleDateString('es-PY')}` : ''}
                  </Text>
                )}

                {promo.hasPromoCode && (
                  <View style={styles.claimSection}>
                    {claimError[promo.id] ? (
                      <Text style={styles.claimError}>{claimError[promo.id]}</Text>
                    ) : null}
                    <TouchableOpacity
                      style={[
                        styles.claimBtn,
                        alreadyClaimed && styles.claimBtnSecondary,
                        claimLoading === promo.id && styles.claimBtnDisabled,
                      ]}
                      onPress={() => handleClaim(promo)}
                      disabled={claimLoading === promo.id}
                      activeOpacity={0.8}
                    >
                      {claimLoading === promo.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={[styles.claimBtnText, alreadyClaimed && styles.claimBtnTextSecondary]}>
                          {alreadyClaimed ? 'Ver mi código' : 'Obtener código'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal de código */}
      <Modal visible={!!codeModal} transparent animationType="fade" onRequestClose={() => setCodeModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {codeModal?.imageUrl && (
              <Image source={{ uri: codeModal.imageUrl }} style={styles.modalImage} />
            )}
            <Text style={styles.modalTitle}>{codeModal?.title}</Text>
            {codeModal?.description ? (
              <Text style={styles.modalDescription}>{codeModal.description}</Text>
            ) : null}
            <Text style={styles.modalCodeLabel}>Tu código de promoción</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{codeModal?.code}</Text>
            </View>
            <Text style={styles.codeHint}>Mostrá este código al llegar al motel{codeModal?.validUntil ? ` · válido hasta ${new Date(codeModal.validUntil).toLocaleDateString('es-PY')}` : ''}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
              <Text style={styles.copyBtnText}>Copiar código</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCodeModal(null)} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A0038',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6A5E6E',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#F0E6F5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    backgroundColor: '#F5E6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#9932CC',
    fontWeight: '700',
    fontSize: 16,
  },
  cardBody: {
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A0038',
    flex: 1,
    marginRight: 12,
  },
  globalBadge: {
    backgroundColor: '#FFE4F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  globalBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#4A3E52',
  },
  descriptionMuted: {
    fontSize: 14,
    color: '#9C8BA5',
    fontStyle: 'italic',
  },
  validity: {
    marginTop: 4,
    fontSize: 12,
    color: '#9C8BA5',
  },
  claimSection: {
    marginTop: 12,
    gap: 6,
  },
  claimError: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  claimBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  claimBtnDisabled: {
    opacity: 0.6,
  },
  claimBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  claimBtnTextSecondary: {
    color: COLORS.primary,
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
  modalImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 4,
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
