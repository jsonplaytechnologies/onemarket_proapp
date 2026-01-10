import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { initI18n, changeLanguage as i18nChangeLanguage, hasSelectedLanguage, markLanguageSelected } from '../i18n';

const FIRST_LAUNCH_KEY = '@onemarket_first_launch';
const LANGUAGE_STORAGE_KEY = '@onemarket_language';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState('fr');
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      // Initialize i18n first
      const initialLanguage = await initI18n();
      setLanguageState(initialLanguage);
      setIsI18nReady(true);

      // Check if this is the first launch (language never selected)
      const hasSelected = await hasSelectedLanguage();

      if (!hasSelected) {
        // First launch - show language selector
        setIsFirstLaunch(true);
      }
    } catch (error) {
      console.error('Error initializing language:', error);
      setIsI18nReady(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (newLanguage) => {
    try {
      const success = await i18nChangeLanguage(newLanguage);
      if (success) {
        setLanguageState(newLanguage);
        await markLanguageSelected(newLanguage);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  };

  const completeFirstLaunch = async (selectedLanguage) => {
    try {
      await setLanguage(selectedLanguage);
      setIsFirstLaunch(false);
      return true;
    } catch (error) {
      console.error('Error completing first launch:', error);
      return false;
    }
  };

  const value = {
    language,
    setLanguage,
    isFirstLaunch,
    isLoading,
    isI18nReady,
    completeFirstLaunch,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
