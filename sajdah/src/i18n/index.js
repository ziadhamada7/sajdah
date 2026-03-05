import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import ar from './ar';
import en from './en';

const i18n = new I18n({ ar, en });


const deviceLocale = getLocales()[0]?.languageCode || 'ar';
i18n.locale = deviceLocale === 'ar' ? 'ar' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'ar';


let _listeners = [];

export const addLanguageListener = (callback) => {
    _listeners.push(callback);
    return () => {
        _listeners = _listeners.filter((l) => l !== callback);
    };
};

export const setLocale = (lang) => {
    i18n.locale = lang;
    _listeners.forEach((cb) => cb(lang));
};

export const getLocale = () => i18n.locale;

export default i18n;
