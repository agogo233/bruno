import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEn from './translation/en.json';
import translationZhCN from './translation/zh-CN.json';

const resources = {
  en: {
    translation: translationEn
  },
  'zh-CN': {
    translation: translationZhCN
  }
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage || 'zh-CN',
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-CN'],
    ns: 'translation',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;