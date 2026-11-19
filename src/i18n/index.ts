import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en';
import tr from './tr';

export type Language = 'tr' | 'en';
export const LANGUAGES: Language[] = ['tr', 'en'];

export function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return code === 'tr' ? 'tr' : 'en';
}

// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
