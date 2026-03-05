import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getTodayPrayerTimes, getPrayerTimesForDate, parseTimeToDate } from './prayerTimes';


if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('prayer-alarm', {
        name: 'تنبيهات الصلاة',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        enableVibrate: true,
        enableLights: true,
        lightColor: '#2D6A6A',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
    });
}


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
    }),
});

const PRAYER_NAMES = {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
};

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];


export const requestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
                allowCriticalAlerts: true,
            },
        });
        finalStatus = status;
    }

    return finalStatus === 'granted';
};


export const getPermissionStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
};


export const scheduleNotifications = async (settings, days = 7) => {
    
    await cancelAllNotifications();

    const scheduledIds = [];

    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);

        
        let prayerTimes;
        if (dayOffset === 0) {
            prayerTimes = await getTodayPrayerTimes();
        } else {
            prayerTimes = await getPrayerTimesForDate(targetDate);
        }

        if (!prayerTimes) continue;

        for (const prayer of PRAYERS) {
            
            if (!settings.enabled[prayer]) continue;

            const timeStr = prayerTimes[prayer];
            if (!timeStr) continue;

            
            const triggerDate = parseTimeToDate(timeStr, targetDate);
            if (!triggerDate) continue;

            
            const offset = settings.offsetMinutes?.[prayer] || 0;
            if (offset) {
                triggerDate.setMinutes(triggerDate.getMinutes() + offset);
            }

            
            if (triggerDate <= new Date()) continue;

            try {
                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `🕌 صلاة ${PRAYER_NAMES[prayer]}`,
                        body: `حان وقت صلاة ${PRAYER_NAMES[prayer]} — صلِّ الآن`,
                        sound: settings.soundEnabled !== false ? 'default' : null,
                        data: { prayer, type: 'prayer_alarm' },
                        priority: 'max',
                        ...(Platform.OS === 'android' && {
                            channelId: 'prayer-alarm',
                        }),
                    },
                    trigger: {
                        type: 'date',
                        date: triggerDate,
                    },
                });

                scheduledIds.push(id);
            } catch (error) {
                console.log(`Failed to schedule ${prayer} for day +${dayOffset}:`, error);
            }
        }
    }

    
    await AsyncStorage.setItem('scheduled_notif_ids', JSON.stringify(scheduledIds));

    return scheduledIds;
};


export const scheduleSnooze = async (prayer) => {
    const snoozeDate = new Date(Date.now() + 5 * 60 * 1000);

    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: `🕌 تذكير: صلاة ${PRAYER_NAMES[prayer] || prayer}`,
                body: `لم تصلِّ بعد! صلِّ ${PRAYER_NAMES[prayer] || prayer} الآن`,
                sound: 'default',
                data: { prayer, type: 'prayer_alarm', isSnooze: true },
                priority: 'max',
                ...(Platform.OS === 'android' && {
                    channelId: 'prayer-alarm',
                }),
            },
            trigger: {
                type: 'date',
                date: snoozeDate,
            },
        });

        return id;
    } catch (error) {
        console.log('Snooze schedule failed:', error);
        return null;
    }
};


export const cancelAllNotifications = async () => {
    try {
        const storedIds = await AsyncStorage.getItem('scheduled_notif_ids');
        if (storedIds) {
            const ids = JSON.parse(storedIds);
            for (const id of ids) {
                try {
                    await Notifications.cancelScheduledNotificationAsync(id);
                } catch (e) {
                    
                }
            }
        }
        await Notifications.cancelAllScheduledNotificationsAsync();
        await AsyncStorage.removeItem('scheduled_notif_ids');
    } catch (error) {
        console.log('Cancel notifications error:', error);
    }
};


export const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🕌 سجدة — تنبيه تجريبي',
            body: 'هذا تنبيه تجريبي من تطبيق سجدة. ستظهر التنبيهات هكذا عند كل صلاة.',
            sound: 'default',
            data: { type: 'test' },
            priority: 'max',
            ...(Platform.OS === 'android' && {
                channelId: 'prayer-alarm',
            }),
        },
        trigger: null, 
    });
};


export const addNotificationListeners = (onReceived, onResponse) => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        if (data?.type === 'prayer_alarm') {
            onReceived?.(data.prayer);
        }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.type === 'prayer_alarm') {
            onResponse?.(data.prayer);
        }
    });

    return () => {
        receivedSub.remove();
        responseSub.remove();
    };
};
