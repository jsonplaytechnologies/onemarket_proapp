import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    if (disabled) {
      return 'bg-gray-200';
    }

    switch (variant) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-gray-100';
      case 'outline':
        return 'bg-white border border-gray-200';
      case 'danger':
        return 'bg-white border border-red-200';
      case 'success':
        return 'bg-emerald-500';
      default:
        return 'bg-primary';
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return '#9CA3AF';
    }

    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return '#1F2937';
      case 'outline':
        return '#2563EB';
      case 'danger':
        return '#EF4444';
      case 'success':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${getButtonStyle()}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'success' ? '#FFFFFF' : '#2563EB'}
        />
      ) : (
        <>
          <Text
            style={[
              {
                fontFamily: 'Poppins-SemiBold',
                fontSize: 16,
                color: getTextColor(),
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && <View className="ml-2">{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
