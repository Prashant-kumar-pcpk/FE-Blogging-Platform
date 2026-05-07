import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authAPI,
  clearSession,
  getStoredRefreshToken,
  getStoredToken,
  persistSession,
  setAuthToken
} from '../API/api';

const AuthContext = createContext();

const normalizeAuthUser = (userData) => {
  if (!userData) {
    return null;
  }

  const normalizedId = userData._id || userData.id || null;

  return {
    ...userData,
    _id: normalizedId,
    id: normalizedId
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(getStoredToken());

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      const loadUser = async () => {
        try {
          const res = await authAPI.getProfile();
          setUser(normalizeAuthUser(res.data));
        } catch (error) {
          if (getStoredRefreshToken()) {
            try {
              const refreshRes = await authAPI.refreshSession(getStoredRefreshToken());
              const { token: refreshedToken, refreshToken, user: refreshedUser } = refreshRes.data;
              persistSession({ token: refreshedToken, refreshToken });
              setToken(refreshedToken);
              setAuthToken(refreshedToken);
              setUser(normalizeAuthUser(refreshedUser));
            } catch (refreshError) {
              console.error('Failed to refresh user session:', refreshError);
              clearSession();
              setToken(null);
              setUser(null);
              setAuthToken(null);
            }
          } else {
            console.error('Failed to load user:', error);
            clearSession();
            setToken(null);
            setUser(null);
            setAuthToken(null);
          }
        } finally {
          setLoading(false);
        }
      };

      loadUser();
    } else {
      setAuthToken(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      const { token: newToken, refreshToken, user: userData } = res.data;

      persistSession({ token: newToken, refreshToken });
      setToken(newToken);
      setAuthToken(newToken);
      setUser(normalizeAuthUser(userData));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);
      const { token: newToken, refreshToken, user: newUser } = res.data;

      persistSession({ token: newToken, refreshToken });
      setToken(newToken);
      setAuthToken(newToken);
      setUser(normalizeAuthUser(newUser));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await authAPI.updateProfile(profileData);
      setUser(normalizeAuthUser(res.data.user));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const res = await authAPI.changePassword(passwordData);
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password change failed'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
