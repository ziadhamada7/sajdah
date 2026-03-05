import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView,
    TouchableOpacity, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useSettingsStore from '../../src/stores/settingsStore';
import useAuthStore from '../../src/stores/authStore';
import i18n from '../../src/i18n';
import {
    requestPermissions, getPermissionStatus,
    sendTestNotification, scheduleNotifications,
} from '../../src/utils/notifications';
import {
    getTodayPrayerTimes, refreshPrayerTimes, getCachedLocation,
} from '../../src/utils/prayerTimes';
import { useRouter } from 'expo-router';

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_ICONS = { fajr: 'sunny-outline', dhuhr: 'sunny', asr: 'partly-sunny', maghrib: 'cloudy-night', isha: 'moon' };

export default function SettingsScreen() {
    const router = useRouter();
    const { language, setLanguage, notifications, updateNotifications, langVersion } = useSettingsStore();
    const { logout } = useAuthStore();
    const [permStatus, setPermStatus] = useState('unknown');
    const [dayBoundaryFajr, setDayBoundaryFajr] = useState(false);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [cityName, setCityName] = useState('');
    const [loadingTimes, setLoadingTimes] = useState(false);

    useEffect(() => { checkPermission(); loadPrayerTimes(); }, []);

    const checkPermission = async () => {
        try { setPermStatus(await getPermissionStatus()); } catch { setPermStatus('unknown'); }
    };

    const loadPrayerTimes = async () => {
        setLoadingTimes(true);
        try {
            const times = await getTodayPrayerTimes();
            setPrayerTimes(times);
            const loc = await getCachedLocation();
            setCityName(loc?.city || times?.city || '');
        } catch (e) { console.log('Load prayer times error:', e); }
        setLoadingTimes(false);
    };

    const handleRefreshTimes = async () => {
        setLoadingTimes(true);
        try {
            const times = await refreshPrayerTimes();
            setPrayerTimes(times);
            if (times?.city) setCityName(times.city);
            Alert.alert('✓', i18n.t('timesUpdated') + (times?.city ? ` — ${times.city}` : ''));
        } catch { Alert.alert(i18n.t('error'), i18n.t('failedUpdateTimes')); }
        setLoadingTimes(false);
    };

    const handleLanguageToggle = () => {
        const newLang = language === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
    };

    const handleNotifToggle = (prayer, value) => {
        updateNotifications({ enabled: { ...notifications.enabled, [prayer]: value } });
    };

    const handleTestNotification = async () => {
        try {
            if (await requestPermissions()) { await sendTestNotification(); Alert.alert('✓', i18n.t('testSent')); }
            else Alert.alert(i18n.t('error'), i18n.t('permDenied'));
        } catch { Alert.alert(i18n.t('error'), i18n.t('failedSendTest')); }
    };

    const handleScheduleAll = async () => {
        try {
            if (await requestPermissions()) {
                const ids = await scheduleNotifications(notifications);
                checkPermission();
                Alert.alert('✓', i18n.t('alarmsScheduled').replace('{{count}}', ids.length));
            } else Alert.alert(i18n.t('error'), i18n.t('permDenied'));
        } catch { Alert.alert(i18n.t('error'), i18n.t('failedSchedule')); }
    };

    const handleLogout = () => {
        Alert.alert(i18n.t('logout'), i18n.t('logoutConfirm'), [
            { text: i18n.t('cancel'), style: 'cancel' },
            { text: i18n.t('logout'), style: 'destructive', onPress: () => { logout(); router.replace('/onboarding'); } },
        ]);
    };

    const cleanTime = (t) => (t ? t.replace(/\s*\(.*\)/, '').trim() : '--:--');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}><Text style={styles.headerTitle}>{i18n.t('settings')}</Text></View>

                {}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.settingRow} onPress={handleLanguageToggle}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: '#E8F4F4' }]}>
                                <Ionicons name="language-outline" size={18} color="#2D6A6A" />
                            </View>
                        </View>
                        <Text style={styles.settingLabel}>{i18n.t('language')}</Text>
                        <Text style={styles.settingValue}>{language === 'ar' ? i18n.t('arabic') : i18n.t('english')}</Text>
                    </TouchableOpacity>
                </View>

                {}
                <View style={styles.section}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Switch value={dayBoundaryFajr} onValueChange={setDayBoundaryFajr} trackColor={{ false: '#D5D0C8', true: '#2D6A6A' }} thumbColor="#FFF" style={styles.switch} />
                        </View>
                        <Text style={styles.settingLabel}>{i18n.t('dayBoundary')}: {dayBoundaryFajr ? i18n.t('fajrTime') : i18n.t('midnight')}</Text>
                    </View>
                </View>

                {}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <TouchableOpacity onPress={handleRefreshTimes} disabled={loadingTimes}>
                            {loadingTimes ? <ActivityIndicator size="small" color="#2D6A6A" /> : <Ionicons name="refresh" size={18} color="#2D6A6A" />}
                        </TouchableOpacity>
                        <Text style={styles.sectionTitle}>{i18n.t('prayerTimes')}</Text>
                    </View>

                    {cityName ? (<View style={styles.cityRow}><Ionicons name="location-outline" size={14} color="#888" /><Text style={styles.cityText}>{cityName}</Text></View>) : null}

                    {PRAYER_KEYS.map((prayer) => (
                        <View key={prayer} style={styles.prayerTimeRow}>
                            <Switch value={notifications.enabled[prayer]} onValueChange={(val) => handleNotifToggle(prayer, val)} trackColor={{ false: '#D5D0C8', true: '#2D6A6A' }} thumbColor="#FFF" style={styles.smallSwitch} />
                            <Text style={styles.prayerTimeValue}>{prayerTimes ? cleanTime(prayerTimes[prayer]) : '--:--'}</Text>
                            <View style={styles.prayerTimeNameRow}>
                                <Ionicons name={PRAYER_ICONS[prayer]} size={16} color="#2D6A6A" />
                                <Text style={styles.prayerTimeName}>{i18n.t(prayer)}</Text>
                            </View>
                        </View>
                    ))}

                    {prayerTimes?.isDefault && (
                        <View style={styles.warningRow}><Ionicons name="warning-outline" size={14} color="#D4A574" /><Text style={styles.warningText}>{i18n.t('defaultTimesWarning')}</Text></View>
                    )}
                </View>

                {}
                <View style={styles.section}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Switch value={notifications.soundEnabled} onValueChange={(v) => updateNotifications({ soundEnabled: v })} trackColor={{ false: '#D5D0C8', true: '#2D6A6A' }} thumbColor="#FFF" style={styles.switch} />
                        </View>
                        <Text style={styles.settingLabel}>{i18n.t('soundEnabled')}</Text>
                    </View>

                    <TouchableOpacity style={styles.scheduleBtn} onPress={handleScheduleAll}>
                        <Ionicons name="alarm-outline" size={18} color="#FFF" />
                        <Text style={styles.scheduleBtnText}>{i18n.t('activateAllAlarms')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.testBtn} onPress={handleTestNotification}>
                        <Text style={styles.testBtnText}>{i18n.t('testNotification')}</Text>
                    </TouchableOpacity>

                    <View style={styles.permRow}>
                        <View style={[styles.permDot, { backgroundColor: permStatus === 'granted' ? '#2D6A6A' : '#D9534F' }]} />
                        <Text style={styles.permText}>{permStatus === 'granted' ? i18n.t('permGranted') : i18n.t('permDenied')}</Text>
                    </View>
                </View>

                {}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.settingRow} onPress={() => Alert.alert(i18n.t('comingSoon'), i18n.t('backupComingSoon'))}>
                        <View style={styles.settingLeft}><View style={[styles.settingIcon, { backgroundColor: '#E8F4F4' }]}><Ionicons name="cloud-download-outline" size={18} color="#2D6A6A" /></View></View>
                        <Text style={styles.settingLabel}>{i18n.t('backup')}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutText}>{i18n.t('logout')}</Text></TouchableOpacity>
                <Text style={styles.versionText}>{i18n.t('appName')} v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F0E8' },
    scrollContent: { paddingTop: 60, paddingBottom: 40 },
    header: { paddingHorizontal: 20, marginBottom: 24, alignItems: 'flex-end' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#2D2D2D' },
    section: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2D2D2D' },
    cityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#F9F6F0' },
    cityText: { fontSize: 12, color: '#888' },
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
    settingLeft: { marginRight: 'auto' },
    settingLabel: { fontSize: 15, fontWeight: '600', color: '#2D2D2D', flex: 1, textAlign: 'right' },
    settingValue: { fontSize: 13, color: '#2D6A6A', fontWeight: '500', marginLeft: 8 },
    settingIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    switch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
    prayerTimeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
    prayerTimeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
    prayerTimeName: { fontSize: 14, fontWeight: '600', color: '#2D2D2D' },
    prayerTimeValue: { fontSize: 14, fontWeight: '700', color: '#2D6A6A', marginHorizontal: 12, width: 50, textAlign: 'center' },
    smallSwitch: { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] },
    warningRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFF8F0' },
    warningText: { fontSize: 11, color: '#D4A574' },
    scheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 8, backgroundColor: '#2D6A6A', borderRadius: 12, paddingVertical: 14 },
    scheduleBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    testBtn: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#E8F4F4', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    testBtnText: { color: '#2D6A6A', fontSize: 14, fontWeight: '600' },
    permRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 18, paddingBottom: 14, gap: 8 },
    permDot: { width: 8, height: 8, borderRadius: 4 },
    permText: { fontSize: 12, color: '#888' },
    logoutBtn: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16 },
    logoutText: { fontSize: 15, fontWeight: '600', color: '#D9534F' },
    versionText: { textAlign: 'center', fontSize: 12, color: '#BBB', marginBottom: 10 },
});
