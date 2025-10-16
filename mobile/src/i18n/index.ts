import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import es from './locales/es.json';

const resources = {
  es: {
    translation: es,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // Idioma por defecto para Colombia
    fallbackLng: 'es',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
