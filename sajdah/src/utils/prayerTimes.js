import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


let Location = null;
try {
    Location = require('expo-location');
} catch (e) {
    console.log('expo-location not installed — using default prayer times');
}

const CACHE_KEY = 'prayer_times_cache';
const LOCATION_CACHE_KEY = 'user_location_cache';



const DEFAULT_METHOD = 5;


export const getLocation = async () => {
    if (!Location) return null;

    try {
        
        const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;
            if (age < 6 * 60 * 60 * 1000) {
                return data;
            }
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Location permission denied');
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        
        let cityName = '';
        try {
            const [geo] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            if (geo) {
                cityName = geo.city || geo.subregion || geo.region || '';
            }
        } catch (e) {
            console.log('Reverse geocode failed:', e);
        }

        const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            city: cityName,
            timestamp: Date.now(),
        };

        await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));
        return locationData;
    } catch (error) {
        console.log('Location error:', error);
        return null;
    }
};


export const fetchPrayerTimes = async (date, latitude, longitude, method = DEFAULT_METHOD) => {
    try {
        const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
        const response = await axios.get(url, { timeout: 10000 });

        if (response.data?.code === 200) {
            const timings = response.data.data.timings;
            return {
                fajr: timings.Fajr,
                sunrise: timings.Sunrise,
                dhuhr: timings.Dhuhr,
                asr: timings.Asr,
                maghrib: timings.Maghrib,
                isha: timings.Isha,
                date: date,
                method: method,
                location: { latitude, longitude },
            };
        }

        throw new Error('API returned non-200 status');
    } catch (error) {
        console.log('Aladhan API error:', error.message);
        return null;
    }
};


export const getTodayPrayerTimes = async () => {
    try {
        const today = formatDateForAPI(new Date());

        
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            if (data.date === today) {
                return data;
            }
        }

        
        const location = await getLocation();
        if (!location) {
            return getDefaultTimes(today);
        }

        
        const times = await fetchPrayerTimes(today, location.latitude, location.longitude);
        if (times) {
            times.city = location.city;
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(times));
            return times;
        }

        return getDefaultTimes(today);
    } catch (error) {
        console.log('getTodayPrayerTimes error:', error);
        return getDefaultTimes(formatDateForAPI(new Date()));
    }
};


export const getPrayerTimesForDate = async (date) => {
    const formattedDate = formatDateForAPI(date);
    const location = await getLocation();

    if (!location) {
        return getDefaultTimes(formattedDate);
    }

    const times = await fetchPrayerTimes(formattedDate, location.latitude, location.longitude);
    return times || getDefaultTimes(formattedDate);
};


export const refreshPrayerTimes = async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
    return getTodayPrayerTimes();
};


export const getCachedLocation = async () => {
    try {
        const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
        if (cached) return JSON.parse(cached);
        return null;
    } catch {
        return null;
    }
};



const formatDateForAPI = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

const getDefaultTimes = (date) => ({
    fajr: '05:00',
    sunrise: '06:30',
    dhuhr: '12:15',
    asr: '15:30',
    maghrib: '18:00',
    isha: '19:30',
    date: date,
    method: DEFAULT_METHOD,
    city: '',
    isDefault: true,
});

export const parseTimeToDate = (timeStr, dateObj = new Date()) => {
    if (!timeStr) return null;
    const clean = timeStr.replace(/\s*\(.*\)/, '').trim();
    const [hours, minutes] = clean.split(':').map(Number);
    const d = new Date(dateObj);
    d.setHours(hours, minutes, 0, 0);
    return d;
};

export const getNextPrayer = (prayerTimes) => {
    if (!prayerTimes) return null;
    const now = new Date();
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    for (const prayer of prayers) {
        const time = parseTimeToDate(prayerTimes[prayer]);
        if (time && time > now) {
            return { prayer, time, timeStr: prayerTimes[prayer] };
        }
    }

    return { prayer: 'fajr', time: null, timeStr: prayerTimes.fajr, isTomorrow: true };
};
