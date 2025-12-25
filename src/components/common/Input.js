import React from 'react';
import { View, TextInput, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Input = ({
  placeholder,
  value,
  onChangeText,
  icon,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  style,
  inputStyle,
}) => {
  const getContainerStyle = () => {
    if (error) return 'bg-red-50 border border-red-300';
    if (!editable) return 'bg-gray-100 border border-gray-200';
    return 'bg-white border border-gray-300';
  };

  return (
    <View className="w-full" style={style}>
      <View
        className={`flex-row items-center rounded-xl px-4 ${
          multiline ? 'py-3' : 'py-3'
        } ${getContainerStyle()}`}
        style={{ minHeight: multiline ? 100 : 50 }}
      >
        {icon && (
          <View className="mr-3">
            {typeof icon === 'string' ? (
              <Ionicons name={icon} size={20} color="#9CA3AF" />
            ) : (
              icon
            )}
          </View>
        )}
        <TextInput
          className="flex-1"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          style={[
            {
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: !editable ? '#9CA3AF' : '#111827',
            },
            multiline && { minHeight: 100, textAlignVertical: 'top' },
            inputStyle,
          ]}
        />
      </View>
      {error && (
        <View className="flex-row items-center mt-2 ml-1">
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
          <Text
            className="text-red-500 ml-1"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

export default Input;
