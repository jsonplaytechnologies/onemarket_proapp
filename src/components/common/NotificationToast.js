/**
 * NotificationToast Component
 * In-app notification banner that slides down from top
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import { COLORS } from '../../constants/colors';
import { navigateToNotification } from '../../utils/notificationRouter';

const { width } = Dimensions.get('window');

const NotificationToast = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { toastData, hideToast } = useNotifications();
  const slideAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (toastData) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [toastData, slideAnim]);

  if (!toastData) return null;

  const getIcon = () => {
    switch (toastData.type) {
      case 'new_booking':
        return { name: 'calendar', color: COLORS.primary, bg: '#EFF6FF' };
      case 'booking_update':
        return { name: 'refresh', color: COLORS.primary, bg: '#EFF6FF' };
      case 'new_message':
        return { name: 'chatbubble', color: '#10B981', bg: '#ECFDF5' };
      case 'payment':
        return { name: 'card', color: '#10B981', bg: '#ECFDF5' };
      case 'job_update':
      case 'job_complete':
        return { name: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5' };
      case 'review':
        return { name: 'star', color: '#F59E0B', bg: '#FFFBEB' };
      case 'withdrawal':
        return { name: 'wallet', color: '#8B5CF6', bg: '#F5F3FF' };
      case 'account':
        return { name: 'person-circle', color: COLORS.primary, bg: '#EFF6FF' };
      default:
        return { name: 'notifications', color: COLORS.primary, bg: '#EFF6FF' };
    }
  };

  const handlePress = () => {
    hideToast();
    navigateToNotification((screen, params) => navigation.navigate(screen, params), toastData);
  };

  const icon = getIcon();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toast}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {toastData.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {toastData.message}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default NotificationToast;
