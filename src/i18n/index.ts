import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './Locales/en.json';
import vi from './Locales/vi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      vi,
    },
    fallbackLng: 'vi',
    debug: false,
    interpolation: {
      escapeValue: false, // React already safe from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });


