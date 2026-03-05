import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = '[YOUR API URL]'; // Android emulator -> localhost
// For iOS simulator: http://localhost:5000
// For physical device: use your machine's local IP

const client = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
client.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('auth_token');
        }
        return Promise.reject(error);
    }
);

export default client;
