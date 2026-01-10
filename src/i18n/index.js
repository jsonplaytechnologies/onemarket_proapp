import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import fr from './fr.json';

const LANGUAGE_STORAGE_KEY = '@onemarket_language';

// Get stored language or detect device language
const getInitialLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage) {
      return storedLanguage;
    }
    // Detect device language, default to French for Gabon
    const deviceLocale = Localization.locale?.split('-')[0] || 'fr';
    return deviceLocale === 'en' || deviceLocale === 'fr' ? deviceLocale : 'fr';
  } catch (error) {
    return 'fr'; // Default to French
  }
};

// Initialize i18n
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: { translation: en },
        fr: { translation: fr },
      },
      lng: initialLanguage,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return initialLanguage;
};

// Change language and persist
export const changeLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.error('Failed to change language:', error);
    return false;
  }
};

// Check if language has been selected before
export const hasSelectedLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return storedLanguage !== null;
  } catch (error) {
    return false;
  }
};

// Mark language as selected
export const markLanguageSelected = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    return true;
  } catch (error) {
    console.error('Failed to mark language as selected:', error);
    return false;
  }
};

export { initI18n };
export default i18n;
