import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authApi from '../services/authApi';

const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginWithOAuth: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos de autenticación al iniciar la app
  useEffect(() => {
    loadAuthData();
  }, []);

  /**
   * Carga datos de autenticación desde AsyncStorage
   */
  const loadAuthData = async () => {
    try {
      setIsLoading(true);
      const [storedToken, storedUser] = await Promise.all([
        authApi.getStoredToken(),
        authApi.getStoredUser(),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Verificar que el token sea válido haciendo una llamada al perfil
        try {
          const profileData = await authApi.getProfile();
          if (profileData.success && profileData.user) {
            setUser(profileData.user);
          }
        } catch (error) {
          // Una caída de red no invalida la sesión local. Solo una respuesta
          // explícita de autenticación puede expulsar al usuario.
          if (error?.status === 401 || error?.status === 403) {
            debugLog('Token inválido o expirado, limpiando datos...');
            await handleLogout();
          } else {
            debugLog('No se pudo revalidar la sesión; se conserva el acceso local.', error);
          }
        }
      }
    } catch (error) {
      debugLog('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registro de nuevo usuario
   */
  const handleRegister = async ({ email, password, name, phone }) => {
    try {
      const data = await authApi.register({ email, password, name, phone });

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Error al registrar usuario' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Login con email/password
   */
  const handleLogin = async ({ email, password }) => {
    try {
      const data = await authApi.login({ email, password });

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Error al iniciar sesión' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Login con OAuth
   */
  const handleLoginWithOAuth = async ({ provider, idToken, accessToken }) => {
    try {
      const data = await authApi.loginWithOAuth({
        provider,
        idToken,
        accessToken,
      });

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Error al iniciar sesión con OAuth' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Logout
   */
  const handleLogout = async () => {
    try {
      await authApi.logout();
      setToken(null);
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Actualizar perfil
   */
  const handleUpdateProfile = async (updates) => {
    try {
      const data = await authApi.updateProfile(updates);

      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Error al actualizar perfil' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Refrescar perfil (obtener datos actualizados del servidor)
   */
  const handleRefreshProfile = async () => {
    try {
      const data = await authApi.getProfile();

      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Error al refrescar perfil' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login: handleLogin,
    loginWithOAuth: handleLoginWithOAuth,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    refreshProfile: handleRefreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
};
