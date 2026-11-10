import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * ErrorBoundary global para capturar errores de renderizado en el árbol de componentes.
 * Muestra una pantalla de recuperación en lugar de un crash silencioso de React Native.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>
            La aplicación encontró un error inesperado. Intentá nuevamente.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.debug} numberOfLines={6}>
              {String(this.state.error)}
            </Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  debug: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#DC2626',
    marginBottom: 20,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  button: {
    backgroundColor: '#822DE2',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});