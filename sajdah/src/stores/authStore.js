import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginAPI, registerAPI, getMeAPI } from '../api/auth';

const useAuthStore = create((set, get) => ({
    token: null,
    user: null,
    isLoading: true,
    isGuest: false,

    // Initialize auth from storage
    init: async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const isGuest = await AsyncStorage.getItem('is_guest');

            if (isGuest === 'true') {
                set({ isGuest: true, isLoading: false });
                return;
            }

            if (token) {
                set({ token });
                const res = await getMeAPI();
                set({ user: res.data.user, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            await AsyncStorage.removeItem('auth_token');
            set({ token: null, user: null, isLoading: false });
        }
    },

    // Login
    login: async (email, password) => {
        const res = await loginAPI(email, password);
        const { token, user } = res.data;
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.removeItem('is_guest');
        set({ token, user, isGuest: false });
        return user;
    },

    // Register
    register: async (email, password, language, initialQadaEstimate) => {
        const res = await registerAPI(email, password, language, initialQadaEstimate);
        const { token, user } = res.data;
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.removeItem('is_guest');
        set({ token, user, isGuest: false });
        return user;
    },

    // Guest mode
    setGuest: async () => {
        await AsyncStorage.setItem('is_guest', 'true');
        set({ isGuest: true, isLoading: false });
    },

    // Logout
    logout: async () => {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('is_guest');
        set({ token: null, user: null, isGuest: false });
    },
}));

export default useAuthStore;
