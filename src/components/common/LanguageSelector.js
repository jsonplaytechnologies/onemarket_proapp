import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../constants/colors';

const LanguageSelector = ({ visible, onComplete, isModal = true }) => {
  const { t } = useTranslation();
  const { language, setLanguage, completeFirstLaunch } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(language || 'fr');
  const [loading, setLoading] = useState(false);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Francais',
      flag: '🇫🇷',
    },
  ];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (onComplete) {
        // First launch flow
        await completeFirstLaunch(selectedLang);
        onComplete(selectedLang);
      } else {
        // Settings change flow
        await setLanguage(selectedLang);
      }
    } catch (error) {
      console.error('Error selecting language:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <View className="w-full max-w-sm">
        {/* Icon */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4">
            <Ionicons name="globe-outline" size={40} color={COLORS.primary} />
          </View>
          <Text
            className="text-2xl text-gray-900 text-center"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            {t('language.title')}
          </Text>
          <Text
            className="text-base text-gray-500 text-center mt-2"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {t('language.subtitle')}
          </Text>
        </View>

        {/* Language Options */}
        <View className="mb-8">
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
                  isSelected
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setSelectedLang(lang.code)}
                activeOpacity={0.7}
              >
                <Text className="text-3xl mr-4">{lang.flag}</Text>
                <View className="flex-1">
                  <Text
                    className={`text-lg ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    {lang.nativeName}
                  </Text>
                  <Text
                    className="text-sm text-gray-500"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {lang.name}
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center justify-center ${
            loading ? 'bg-blue-400' : 'bg-primary'
          }`}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="text-white text-base"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              {t('language.confirm')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isModal) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <SafeAreaView className="flex-1 bg-white">
          {content}
        </SafeAreaView>
      </Modal>
    );
  }

  return content;
};

// Language Change Modal for Profile Settings
export const LanguageChangeModal = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(language);
  const [loading, setLoading] = useState(false);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Francais',
      flag: '🇫🇷',
    },
  ];

  const handleConfirm = async () => {
    if (selectedLang === language) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await setLanguage(selectedLang);
      onClose();
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text
              className="text-xl text-gray-900"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              {t('language.changeLanguage')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Language Options */}
          <View className="mb-6">
            {languages.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
                    isSelected
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setSelectedLang(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text className="text-3xl mr-4">{lang.flag}</Text>
                  <View className="flex-1">
                    <Text
                      className={`text-lg ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text
                      className="text-sm text-gray-500"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {lang.name}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            className={`py-4 rounded-2xl items-center justify-center ${
              loading ? 'bg-blue-400' : 'bg-primary'
            }`}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className="text-white text-base"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                {t('language.confirm')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LanguageSelector;
