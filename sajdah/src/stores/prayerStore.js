import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ensureTodayAPI,
    markPresentAPI,
    addQadaAPI,
    undoAPI,
    closeMissedAPI,
    getHistoryAPI,
    getStatsAPI,
} from '../api/prayers';

const usePrayerStore = create((set, get) => ({
    // Today state
    todayDate: null,
    presentDone: {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
    },
    qadaRemaining: 0,
    isLoading: false,

    // History
    history: [],
    stats: null,

    // Load today's data
    loadToday: async () => {
        set({ isLoading: true });
        try {
            // First close any missed days
            try {
                await closeMissedAPI();
            } catch (e) {
                // Non-critical — may fail if no previous days
            }

            const res = await ensureTodayAPI();
            set({
                todayDate: res.data.date,
                presentDone: res.data.presentDone,
                qadaRemaining: res.data.qadaRemaining,
                isLoading: false,
            });

            // Cache locally
            await AsyncStorage.setItem('today_cache', JSON.stringify(res.data));
        } catch (error) {
            // Try loading from cache
            try {
                const cached = await AsyncStorage.getItem('today_cache');
                if (cached) {
                    const data = JSON.parse(cached);
                    set({
                        todayDate: data.date,
                        presentDone: data.presentDone,
                        qadaRemaining: data.qadaRemaining,
                        isLoading: false,
                    });
                } else {
                    set({ isLoading: false });
                }
            } catch {
                set({ isLoading: false });
            }
        }
    },

    // Load today from local cache for guest mode
    loadTodayGuest: async () => {
        try {
            const cached = await AsyncStorage.getItem('guest_today');
            const today = new Date().toISOString().split('T')[0];

            if (cached) {
                const data = JSON.parse(cached);

                // Check if cached data is from today
                if (data.date === today) {
                    set({
                        todayDate: data.date,
                        presentDone: data.presentDone,
                        qadaRemaining: data.qadaRemaining,
                    });
                } else {
                    // New day — count missed prayers from yesterday and add to qada
                    const missedCount = Object.values(data.presentDone || {}).filter((v) => !v).length;
                    const newRemaining = (data.qadaRemaining || 0) + missedCount;

                    const newData = {
                        date: today,
                        presentDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
                        qadaRemaining: newRemaining,
                    };
                    set({
                        todayDate: newData.date,
                        presentDone: newData.presentDone,
                        qadaRemaining: newData.qadaRemaining,
                    });
                    await AsyncStorage.setItem('guest_today', JSON.stringify(newData));
                }
            } else {
                // No cache — use saved estimate from onboarding or default to 8000
                const savedEstimate = await AsyncStorage.getItem('qada_initial_estimate');
                const estimate = savedEstimate ? parseInt(savedEstimate) : 8000;

                const defaults = {
                    date: today,
                    presentDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
                    qadaRemaining: estimate,
                };
                set({
                    todayDate: defaults.date,
                    presentDone: defaults.presentDone,
                    qadaRemaining: defaults.qadaRemaining,
                });
                await AsyncStorage.setItem('guest_today', JSON.stringify(defaults));
            }
        } catch {
            // Default state
        }
    },

    // Mark present prayer
    markPresent: async (prayer) => {
        try {
            const res = await markPresentAPI(prayer);
            set({ presentDone: res.data.presentDone });
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Mark present prayer (guest mode)
    markPresentGuest: async (prayer) => {
        const key = prayer.toLowerCase();
        const state = get();
        const newPresentDone = { ...state.presentDone, [key]: true };
        set({ presentDone: newPresentDone });

        const cached = {
            date: state.todayDate,
            presentDone: newPresentDone,
            qadaRemaining: state.qadaRemaining,
        };
        await AsyncStorage.setItem('guest_today', JSON.stringify(cached));
    },

    // Add qada
    addQada: async (prayer, count) => {
        try {
            const res = await addQadaAPI(prayer, count);
            set({ qadaRemaining: res.data.qadaRemaining });
            return res.data;
        } catch (error) {
            throw error;
        }
    },

    // Add qada (guest mode)
    addQadaGuest: async (prayer, count) => {
        const state = get();
        const newRemaining = Math.max(0, state.qadaRemaining - count);
        set({ qadaRemaining: newRemaining });

        const cached = {
            date: state.todayDate,
            presentDone: state.presentDone,
            qadaRemaining: newRemaining,
        };
        await AsyncStorage.setItem('guest_today', JSON.stringify(cached));
    },

    // Undo last action
    undo: async () => {
        try {
            const res = await undoAPI();
            set({
                presentDone: res.data.presentDone || get().presentDone,
                qadaRemaining: res.data.qadaRemaining,
            });
            return res.data;
        } catch (error) {
            throw error;
        }
    },

    // Load history
    loadHistory: async (from, to) => {
        try {
            const res = await getHistoryAPI(from, to);
            set({ history: res.data.history });
        } catch (error) {
            console.log('Failed to load history:', error);
        }
    },

    // Load stats
    loadStats: async () => {
        try {
            const res = await getStatsAPI();
            set({ stats: res.data });
        } catch (error) {
            console.log('Failed to load stats:', error);
        }
    },
}));

export default usePrayerStore;
