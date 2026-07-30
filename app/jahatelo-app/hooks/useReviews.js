import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { getApiRoot } from '../services/apiBaseUrl';

const API_URL = getApiRoot();
const PAGE_SIZE = 10;

const isJsonResponse = (response) =>
  response.headers.get('content-type')?.includes('application/json');

export default function useReviews({ motelId, isAuthenticated, token }) {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userCanReview, setUserCanReview] = useState(true);
  const [cooldownMessage, setCooldownMessage] = useState('');

  const loadReviews = useCallback(async (offset = 0, replace = false) => {
    if (!motelId) return;

    try {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      const response = await fetch(
        `${API_URL}/api/mobile/reviews?motelId=${motelId}&limit=${PAGE_SIZE}&offset=${offset}`
      );

      if (!isJsonResponse(response)) {
        console.error('Error: respuesta no es JSON', {
          status: response.status,
          contentType: response.headers.get('content-type'),
        });
        return;
      }

      const data = await response.json();
      if (response.ok) {
        const incoming = data.reviews || [];
        setReviews((previous) => replace ? incoming : [...previous, ...incoming]);
        setTotal(data.meta?.total ?? 0);
      } else {
        console.error('Error al cargar reseñas:', data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [motelId]);

  const checkUserCanReview = useCallback(async () => {
    if (!motelId || !isAuthenticated || !token) {
      setUserCanReview(false);
      setCooldownMessage('');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/mobile/reviews/can-review?motelId=${motelId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!isJsonResponse(response)) {
        console.error('Error: respuesta no es JSON en can-review', {
          status: response.status,
          contentType: response.headers.get('content-type'),
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
  }, [isAuthenticated, motelId, token]);

  useEffect(() => {
    if (!motelId) return;
    loadReviews(0, true);
    checkUserCanReview();
  }, [checkUserCanReview, loadReviews, motelId]);

  const loadMore = useCallback(() => {
    if (loadingMore || reviews.length >= total) return;
    loadReviews(reviews.length, false);
  }, [loadReviews, loadingMore, reviews.length, total]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadReviews(0, true), checkUserCanReview()]);
    } finally {
      setRefreshing(false);
    }
  }, [checkUserCanReview, loadReviews]);

  const deleteReview = useCallback((reviewId) => {
    Alert.alert(
      'Eliminar reseña',
      '¿Estás seguro de que querés eliminar tu reseña?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/mobile/reviews?id=${reviewId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.ok) {
                setReviews((previous) => previous.filter((review) => review.id !== reviewId));
                setTotal((previous) => Math.max(0, previous - 1));
                await checkUserCanReview();
              } else {
                const data = await response.json();
                Alert.alert('Error', data.error || 'No se pudo eliminar la reseña');
              }
            } catch {
              Alert.alert('Error', 'Error de conexión');
            }
          },
        },
      ]
    );
  }, [checkUserCanReview, token]);

  const submitReview = useCallback(async ({ rating, comment, isAnonymous }) => {
    if (!motelId) return false;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_URL}/api/mobile/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motelId, score: rating, comment: comment.trim(), isAnonymous }),
      });

      if (!isJsonResponse(response)) {
        console.error('Error: respuesta no es JSON al enviar reseña', {
          status: response.status,
          contentType: response.headers.get('content-type'),
        });
        Alert.alert('Error', 'Hubo un problema al enviar tu reseña. Por favor intenta de nuevo.');
        return false;
      }

      const data = await response.json();
      if (response.status === 429) {
        Alert.alert('Espera un momento', data.error || 'Debes esperar antes de dejar otra reseña');
        return false;
      }
      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo publicar la reseña');
        return false;
      }

      Alert.alert('¡Gracias!', 'Tu reseña ha sido publicada exitosamente');
      await loadReviews(0, true);
      await checkUserCanReview();
      return true;
    } catch (error) {
      console.error('Error al enviar reseña:', error);
      Alert.alert('Error', 'No se pudo enviar la reseña. Intenta de nuevo.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [checkUserCanReview, loadReviews, motelId, token]);

  return {
    reviews,
    total,
    loading,
    refreshing,
    loadingMore,
    submitting,
    userCanReview,
    cooldownMessage,
    refresh,
    loadMore,
    deleteReview,
    submitReview,
  };
}
