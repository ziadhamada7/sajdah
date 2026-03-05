import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, Vibration, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import i18n from '../i18n';

const PRAYER_COLORS = { fajr: '#5B9A8B', dhuhr: '#4A90A4', asr: '#D4A574', maghrib: '#6B8E6B', isha: '#7B6B8D' };
const PRAYER_ICONS = { fajr: 'sunny-outline', dhuhr: 'sunny', asr: 'partly-sunny', maghrib: 'cloudy-night', isha: 'moon' };

export default function AlarmOverlay({ visible, prayer, onDismiss, onSnooze }) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [secondsLeft, setSecondsLeft] = useState(60);

    useEffect(() => {
        if (visible) {
            setSecondsLeft(60);
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            );
            pulse.start();

            Vibration.vibrate([0, 500, 500, 500, 500, 500], true);

            const hapticInterval = setInterval(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }, 2000);

            const countdown = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) { handleDismiss(); return 0; }
                    return prev - 1;
                });
            }, 1000);

            return () => { pulse.stop(); Vibration.cancel(); clearInterval(hapticInterval); clearInterval(countdown); };
        }
    }, [visible]);

    const handleDismiss = () => {
        Vibration.cancel();
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onDismiss?.());
    };

    const handleSnooze = () => {
        Vibration.cancel();
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onSnooze?.());
    };

    const prayerKey = prayer?.toLowerCase() || 'fajr';
    const color = PRAYER_COLORS[prayerKey] || '#2D6A6A';
    const icon = PRAYER_ICONS[prayerKey] || 'time';

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                <View style={[styles.bgOverlay, { backgroundColor: color }]} />
                <View style={styles.content}>
                    <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                        <View style={styles.iconInner}><Ionicons name={icon} size={60} color="#FFF" /></View>
                    </Animated.View>
                    <Text style={styles.title}>{i18n.t('prayerTimeNow')}</Text>
                    <Text style={styles.prayerName}>{i18n.t(prayerKey)}</Text>
                    <Text style={styles.timer}>{secondsLeft} {i18n.t('seconds')}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#FFF' }]} onPress={handleDismiss} activeOpacity={0.8}>
                            <Ionicons name="checkmark-circle" size={24} color={color} />
                            <Text style={[styles.mainBtnText, { color }]}>{i18n.t('prayNow')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze} activeOpacity={0.7}>
                            <Ionicons name="alarm-outline" size={18} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.snoozeBtnText}>{i18n.t('snooze5min')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.92 },
    content: { alignItems: 'center', paddingHorizontal: 40 },
    iconContainer: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
    iconInner: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
    prayerName: { fontSize: 42, fontWeight: '800', color: '#FFF', marginBottom: 16, textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
    timer: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 48 },
    actions: { width: '100%', alignItems: 'center', gap: 16 },
    mainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', paddingVertical: 18, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
    mainBtnText: { fontSize: 18, fontWeight: '700' },
    snoozeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)' },
    snoozeBtnText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
});
