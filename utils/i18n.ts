import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from '@/locales/fr.json';
import en from '@/locales/en.json';

const resources = {
  fr: {
    translation: fr
  },
  en: {
    translation: en
  }
};

// Fonction pour charger la langue sauvegardée
const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
    return savedLanguage || 'fr'; // défaut: français
  } catch (error) {
    return 'fr';
  }
};

// Fonction pour sauvegarder la langue
const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem('selectedLanguage', language);
  } catch (error) {
    console.log('Erreur sauvegarde langue:', error);
  }
};

// Initialiser i18n avec la langue sauvegardée
loadSavedLanguage().then((savedLng) => {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLng,
      fallbackLng: 'fr',
      
      interpolation: {
        escapeValue: false
      },
      
      react: {
        useSuspense: false
      }
    });

  // Sauvegarder quand la langue change
  i18n.on('languageChanged', (lng) => {
    saveLanguage(lng);
  });
});

export default i18n;