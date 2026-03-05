import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { getSettingsAPI, updateNotificationsAPI, updateProfileAPI } from '../api/settings';
import i18n, { setLocale } from '../i18n';

const useSettingsStore = create((set, get) => ({
    language: 'ar',
    isRTL: true,
    notifications: {
        enabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
        offsetMinutes: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
        soundEnabled: true,
        manualTimes: { fajr: '05:00', dhuhr: '12:30', asr: '15:45', maghrib: '18:15', isha: '19:45' },
    },
    hasCompletedOnboarding: false,
    
    langVersion: 0,

    
    init: async () => {
        try {
            const lang = await AsyncStorage.getItem('language');
            const onboarded = await AsyncStorage.getItem('onboarding_done');

            if (lang) {
                setLocale(lang);
                set({ language: lang, isRTL: lang === 'ar' });
            }

            if (onboarded === 'true') {
                set({ hasCompletedOnboarding: true });
            }

            
            try {
                const res = await getSettingsAPI();
                if (res.data.notifications) {
                    set({ notifications: res.data.notifications });
                    await AsyncStorage.setItem('notif_settings', JSON.stringify(res.data.notifications));
                }
            } catch {
                
                const cached = await AsyncStorage.getItem('notif_settings');
                if (cached) {
                    set({ notifications: JSON.parse(cached) });
                }
            }
        } catch (error) {
            console.log('Settings init error:', error);
        }
    },

    
    setLanguage: async (lang) => {
        setLocale(lang);
        const isRTL = lang === 'ar';

        await AsyncStorage.setItem('language', lang);
        
        set((state) => ({
            language: lang,
            isRTL,
            langVersion: state.langVersion + 1,
        }));

        
        try {
            await updateProfileAPI({ language: lang });
        } catch {
            
        }

        
        if (I18nManager.isRTL !== isRTL) {
            I18nManager.allowRTL(isRTL);
            I18nManager.forceRTL(isRTL);
        }
    },

    
    updateNotifications: async (updates) => {
        const current = get().notifications;
        const merged = { ...current, ...updates };

        set({ notifications: merged });
        await AsyncStorage.setItem('notif_settings', JSON.stringify(merged));

        try {
            await updateNotificationsAPI(updates);
        } catch {
            
        }
    },

    
    completeOnboarding: async () => {
        await AsyncStorage.setItem('onboarding_done', 'true');
        set({ hasCompletedOnboarding: true });
    },
}));

export default useSettingsStore;
