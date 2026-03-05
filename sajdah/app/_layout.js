import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { I18nManager, AppState } from 'react-native';
import useAuthStore from '../src/stores/authStore';
import useSettingsStore from '../src/stores/settingsStore';
import AlarmOverlay from '../src/components/AlarmOverlay';
import { addNotificationListeners, scheduleSnooze } from '../src/utils/notifications';

export default function RootLayout() {
    const initAuth = useAuthStore((s) => s.init);
    const initSettings = useSettingsStore((s) => s.init);
    const [alarmVisible, setAlarmVisible] = useState(false);
    const [alarmPrayer, setAlarmPrayer] = useState(null);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        
        if (!I18nManager.isRTL) {
            I18nManager.allowRTL(true);
            I18nManager.forceRTL(true);
        }
        initAuth();
        initSettings();

        
        const cleanup = addNotificationListeners(
            
            (prayer) => {
                setAlarmPrayer(prayer);
                setAlarmVisible(true);
            },
            
            (prayer) => {
                setAlarmPrayer(prayer);
                setAlarmVisible(true);
            }
        );

        return cleanup;
    }, []);

    const handleAlarmDismiss = () => {
        setAlarmVisible(false);
        setAlarmPrayer(null);
    };

    const handleAlarmSnooze = async () => {
        setAlarmVisible(false);
        if (alarmPrayer) {
            await scheduleSnooze(alarmPrayer);
        }
        setAlarmPrayer(null);
    };

    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
            </Stack>

            {}
            <AlarmOverlay
                visible={alarmVisible}
                prayer={alarmPrayer}
                onDismiss={handleAlarmDismiss}
                onSnooze={handleAlarmSnooze}
            />
        </>
    );
}
