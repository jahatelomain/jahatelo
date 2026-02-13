import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';
import { getApiRoot } from '../../services/apiBaseUrl';

const API_URL = getApiRoot();

export default function ReviewsTab({ route, navigation }) {
  const { motel } = route.params || {};
  const { isAuthenticated, token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userCanReview, setUserCanReview] = useState(true);
  const [cooldownMessage, setCooldownMessage] = useState('');

  useEffect(() => {
    if (motel?.id) {
      loadReviews();
      checkUserCanReview();
    }
  }, [motel?.id, isAuthenticated]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/mobile/reviews?motelId=${motel.id}`);

      // Verificar si la respuesta es JSON antes de parsear
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Error: respuesta no es JSON', {
          status: response.status,
          contentType,
          url: response.url,
        });
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews || []);
      } else {
        console.error('Error al cargar reseñas:', data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserCanReview = async () => {
    if (!isAuthenticated || !token) {
      setUserCanReview(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/mobile/reviews/can-review?motelId=${motel.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Verificar si la respuesta es JSON antes de parsear
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Error: respuesta no es JSON en can-review', {
          status: response.status,
          contentType,
        });
        setUserCanReview(false);
        return;
      }

      const data = await response.json();

      if (response.status === 429) {
        setUserCanReview(false);
        setCooldownMessage(data.error || 'Debes esperar antes de dejar otra reseña');
      } else if (response.ok) {
        setUserCanReview(true);
        setCooldownMessage('');
      } else {
        setUserCanReview(false);
        console.error('Error al verificar si puede reseñar:', data.error);
      }
    } catch (error) {
      console.error('Error al verificar si puede reseñar:', error);
      setUserCanReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Inicia sesión',
        'Necesitas una cuenta para dejar una reseña',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Error', 'La reseña debe tener al menos 10 caracteres');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_URL}/api/mobile/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motelId: motel.id,
          score: rating,
          comment: comment.trim(),
          isAnonymous,
        }),
      });

      // Verificar si la respuesta es JSON antes de parsear
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Error: respuesta no es JSON al enviar reseña', {
          status: response.status,
          contentType,
        });
        Alert.alert('Error', 'Hubo un problema al enviar tu reseña. Por favor intenta de nuevo.');
        return;
      }

      const data = await response.json();

      if (response.status === 429) {
        Alert.alert('Espera un momento', data.error || 'Debes esperar antes de dejar otra reseña');
      } else if (response.ok) {
        Alert.alert('¡Gracias!', 'Tu reseña ha sido publicada exitosamente');
        setShowReviewForm(false);
        setRating(0);
        setComment('');
        setIsAnonymous(false);
        await loadReviews();
        await checkUserCanReview();
      } else {
        Alert.alert('Error', data.error || 'No se pudo publicar la reseña');
      }
    } catch (error) {
      console.error('Error al enviar reseña:', error);
      Alert.alert('Error', 'No se pudo enviar la reseña. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (score, onPress = null, size = 24) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= score ? 'star' : 'star-outline'}
              size={size}
              color="#FFD700"
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!motel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la información del motel</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando reseñas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Estadísticas */}
        {motel.ratingAvg && (
          <View style={styles.statsContainer}>
            <View style={styles.ratingOverview}>
              <Text style={styles.ratingNumber}>{motel.ratingAvg.toFixed(1)}</Text>
              {renderStars(Math.round(motel.ratingAvg), null, 20)}
              <Text style={styles.reviewCount}>
                {motel.ratingCount} {motel.ratingCount === 1 ? 'reseña' : 'reseñas'}
              </Text>
            </View>
          </View>
        )}

        {/* Botón para dejar reseña */}
        {!showReviewForm && isAuthenticated && userCanReview && (
          <TouchableOpacity
            style={styles.writeReviewButton}
            onPress={() => setShowReviewForm(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.white} />
            <Text style={styles.writeReviewButtonText}>Escribir una reseña</Text>
          </TouchableOpacity>
        )}

        {/* Mensaje de cooldown */}
        {!showReviewForm && isAuthenticated && !userCanReview && cooldownMessage && (
          <View style={styles.cooldownContainer}>
            <Ionicons name="time-outline" size={20} color={COLORS.textLight} />
            <Text style={styles.cooldownText}>{cooldownMessage}</Text>
          </View>
        )}

        {/* Botón para invitados */}
        {!showReviewForm && !isAuthenticated && (
          <TouchableOpacity
            style={styles.loginPromptButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.loginPromptButtonText}>Inicia sesión para dejar una reseña</Text>
          </TouchableOpacity>
        )}

        {/* Formulario de reseña */}
        {showReviewForm && (
          <View style={styles.reviewForm}>
            <Text style={styles.formTitle}>Tu reseña</Text>

            {/* Rating Stars */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Calificación *</Text>
              {renderStars(rating, setRating, 32)}
            </View>

            {/* Comment Input */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Comentario *</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Comparte tu experiencia (mínimo 10 caracteres)"
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
              <Text style={styles.characterCount}>{comment.length}/500</Text>
            </View>

            {/* Anonymous Toggle */}
            <TouchableOpacity
              style={styles.anonymousToggle}
              onPress={() => setIsAnonymous(!isAnonymous)}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxContainer}>
                <Ionicons
                  name={isAnonymous ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.anonymousLabel}>Publicar como anónimo</Text>
              </View>
              <Ionicons name="help-circle-outline" size={20} color={COLORS.textLight} />
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowReviewForm(false);
                  setRating(0);
                  setComment('');
                  setIsAnonymous(false);
                }}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Publicar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de reseñas */}
        {reviews.length > 0 ? (
          <View style={styles.reviewsList}>
            <Text style={styles.reviewsListTitle}>Todas las reseñas</Text>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAuthor}>
                    <View style={styles.avatarContainer}>
                      <Ionicons name="person" size={20} color={COLORS.white} />
                    </View>
                    <View style={styles.authorInfo}>
                      <View style={styles.authorNameRow}>
                        <Text style={styles.authorName}>
                          {review.isAnonymous ? 'Anónimo' : review.user?.name || 'Usuario'}
                        </Text>
                        {review.isVerified && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.verifiedText}>Verificado</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                    </View>
                  </View>
                  {renderStars(review.score, null, 16)}
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Aún no hay reseñas</Text>
            <Text style={styles.emptySubtext}>Sé el primero en compartir tu experiencia</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  statsContainer: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  ratingOverview: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  writeReviewButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  cooldownText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  loginPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  loginPromptButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewForm: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anonymousLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsList: {
    marginTop: 8,
  },
  reviewsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
});
