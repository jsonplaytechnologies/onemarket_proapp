import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
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

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await apiService.get(API_ENDPOINTS.ME);
      if (response.success) {
        setUser(response.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        return response.data; // Return updated user data
      }
      return null;
    } catch (error) {
      console.error('Fetch user error:', error);
      return null;
    }
  };

  const login = async (tokenValue, userData) => {
    try {
      await AsyncStorage.setItem('token', tokenValue);
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
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
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
    login,
    logout,
    updateUser,
    fetchUserProfile,
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
