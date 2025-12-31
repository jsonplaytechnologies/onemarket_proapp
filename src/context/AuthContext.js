import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import cacheManager, { CACHE_KEYS, CACHE_TYPES } from '../utils/cacheManager';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileLastFetched, setProfileLastFetched] = useState(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    // Set up the onAuthExpired callback
    apiService.setOnAuthExpired(() => {
      // Clear local state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      // The navigation will automatically switch to Auth stack when isAuthenticated becomes false
    });

    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setIsAuthenticated(true);

        // Fetch latest user data
        await fetchUserProfile(storedToken);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && !cacheManager.isStale(CACHE_KEYS.PROFILE, CACHE_TYPES.PROFILE)) {
        const cached = cacheManager.get(CACHE_KEYS.PROFILE, CACHE_TYPES.PROFILE);
        if (cached) {
          return cached;
        }
      }

      const response = await cacheManager.deduplicatedFetch(
        CACHE_KEYS.PROFILE,
        () => apiService.get(API_ENDPOINTS.ME)
      );

      if (response.success) {
        setUser(response.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        cacheManager.set(CACHE_KEYS.PROFILE, response.data);
        setProfileLastFetched(Date.now());
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Fetch user error:', error);
      return null;
    }
  }, []);

  // Get profile from cache without fetching (for screens that don't need fresh data)
  const getProfileFromCache = useCallback(() => {
    return user;
  }, [user]);

  // Check if profile is stale and needs refresh
  const isProfileStale = useCallback(() => {
    return cacheManager.isStale(CACHE_KEYS.PROFILE, CACHE_TYPES.PROFILE);
  }, []);

  const login = async (tokenValue, userData, refreshTokenValue = null) => {
    try {
      // Use api service to store tokens
      await apiService.storeTokens(tokenValue, refreshTokenValue);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setToken(tokenValue);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Use api service to clear tokens (clears token, refreshToken, and user)
      await apiService.clearTokens();
      // Clear all cached data on logout
      cacheManager.clear();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setProfileLastFetched(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  // Check if user is approved (for Pro accounts)
  const isApproved = () => {
    return user?.approval_status === 'approved';
  };

  // Check if user is pending approval
  const isPending = () => {
    return user?.approval_status === 'pending';
  };

  // Check if user is rejected
  const isRejected = () => {
    return user?.approval_status === 'rejected';
  };

  // Get approval status
  const getApprovalStatus = () => {
    return user?.approval_status || 'pending';
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    profileLastFetched,
    login,
    logout,
    updateUser,
    fetchUserProfile,
    getProfileFromCache,
    isProfileStale,
    isApproved,
    isPending,
    isRejected,
    getApprovalStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
