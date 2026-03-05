import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../../src/stores/authStore';
import usePrayerStore from '../../src/stores/prayerStore';
import useSettingsStore from '../../src/stores/settingsStore';
import { closeMissedAPI } from '../../src/api/prayers';
import i18n from '../../src/i18n';
import { useRouter } from 'expo-router';

const PRAYERS = [
    { key: 'fajr', id: 'FAJR', color: '#5B9A8B' },
    { key: 'dhuhr', id: 'DHUHR', color: '#4A90A4' },
    { key: 'asr', id: 'ASR', color: '#D4A574' },
    { key: 'maghrib', id: 'MAGHRIB', color: '#6B8E6B' },
    { key: 'isha', id: 'ISHA', color: '#7B6B8D' },
];

export default function TodayScreen() {
    const router = useRouter();
    const { isGuest, token, isLoading: authLoading } = useAuthStore();
    const {
        presentDone, qadaRemaining, isLoading,
        loadToday, loadTodayGuest, markPresent, markPresentGuest,
        addQada, addQadaGuest, undo,
    } = usePrayerStore();
    
    const langVersion = useSettingsStore((s) => s.langVersion);

    const [selectedPrayer, setSelectedPrayer] = useState(null);
    const [qadaCount, setQadaCount] = useState(1);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!token && !isGuest) {
            router.replace('/onboarding');
            return;
        }
        if (isGuest) loadTodayGuest();
        else loadToday();
    }, [authLoading, token, isGuest]);

    const handlePrayerPress = (prayer) => {
        setSelectedPrayer(prayer);
        setQadaCount(1);
        setSheetVisible(true);
    };

    const closeSheet = () => {
        setSheetVisible(false);
        setSelectedPrayer(null);
        setActionLoading(false);
    };

    const handleMarkPresent = async () => {
        if (!selectedPrayer || actionLoading) return;
        setActionLoading(true);
        try {
            if (isGuest) await markPresentGuest(selectedPrayer.id);
            else await markPresent(selectedPrayer.id);
            closeSheet();
        } catch (error) {
            setActionLoading(false);
            Alert.alert(i18n.t('error'), error?.response?.data?.error || i18n.t('failedMarkPrayer'));
        }
    };

    const handleAddQada = async () => {
        if (!selectedPrayer || qadaCount < 1 || actionLoading) return;
        setActionLoading(true);
        try {
            if (isGuest) await addQadaGuest(selectedPrayer.id, qadaCount);
            else await addQada(selectedPrayer.id, qadaCount);
            closeSheet();
        } catch (error) {
            setActionLoading(false);
            Alert.alert(i18n.t('error'), error?.response?.data?.error || i18n.t('failedAddQada'));
        }
    };

    const handleQuickQada = async (count) => {
        try {
            if (isGuest) await addQadaGuest('FAJR', count);
            else await addQada('FAJR', count);
        } catch (error) {
            Alert.alert(i18n.t('error'), error?.response?.data?.error || i18n.t('failed'));
        }
    };

    const handleUndo = async () => {
        if (actionLoading) return;
        setActionLoading(true);
        try {
            if (isGuest) {
                Alert.alert('', i18n.t('undoNotAvailableGuest'));
                setActionLoading(false);
                return;
            }
            const result = await undo();
            closeSheet();
            Alert.alert('✓', result?.message || i18n.t('undoSuccess'));
        } catch (error) {
            setActionLoading(false);
            Alert.alert(i18n.t('error'), error?.response?.data?.error || i18n.t('noActionsToUndo'));
        }
    };

    const handleDailyClose = async () => {
        try {
            if (isGuest) {
                const allDone = Object.values(presentDone || {}).every((v) => v);
                if (allDone) {
                    Alert.alert('✓', i18n.t('allPrayersDone'));
                } else {
                    const missed = Object.values(presentDone || {}).filter((v) => !v).length;
                    Alert.alert(
                        i18n.t('alert'),
                        i18n.t('missedPrayersAlert').replace('{{count}}', missed),
                        [
                            { text: i18n.t('cancel'), style: 'cancel' },
                            {
                                text: i18n.t('closeDay'),
                                onPress: async () => {
                                    const missedCount = Object.values(presentDone || {}).filter((v) => !v).length;
                                    if (missedCount > 0) {
                                        const newRemaining = qadaRemaining + missedCount;
                                        const today = new Date().toISOString().split('T')[0];
                                        await AsyncStorage.setItem('guest_today', JSON.stringify({
                                            date: today,
                                            presentDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
                                            qadaRemaining: newRemaining,
                                        }));
                                        loadTodayGuest();
                                    }
                                    Alert.alert('✓', i18n.t('dayClosed').replace('{{count}}', missedCount));
                                },
                            },
                        ]
                    );
                }
            } else {
                await closeMissedAPI();
                await loadToday();
                Alert.alert('✓', i18n.t('closedPrevDays'));
            }
        } catch (error) {
            Alert.alert(i18n.t('error'), i18n.t('failedClose'));
        }
    };

    const isPrayerDone = (key) => presentDone?.[key] || false;
    const completedCount = Object.values(presentDone || {}).filter((v) => v).length;

    if (authLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2D6A6A" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/(tabs)/settings')}>
                        <Ionicons name="notifications-outline" size={24} color="#2D6A6A" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitle}>{i18n.t('today')}</Text>
                        <Ionicons name="chevron-back" size={18} color="#2D6A6A" />
                    </View>
                </View>

                {}
                <View style={styles.prayerList}>
                    {PRAYERS.map((prayer, index) => {
                        const done = isPrayerDone(prayer.key);
                        return (
                            <TouchableOpacity
                                key={prayer.key}
                                style={[styles.prayerCard, index === PRAYERS.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => handlePrayerPress(prayer)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.prayerRight}>
                                    {done ? (
                                        <Ionicons name="checkmark-circle" size={24} color="#2D6A6A" />
                                    ) : (
                                        <View style={styles.emptyCheck} />
                                    )}
                                </View>
                                <Text style={[styles.prayerName, done && styles.prayerNameDone]}>
                                    {i18n.t(prayer.key)}
                                </Text>
                                <View style={styles.prayerLeft}>
                                    <View style={[styles.statusDot, { backgroundColor: done ? '#2D6A6A' : prayer.color }]} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {}
                <View style={styles.quickActions}>
                    {[{ label: '+1', value: 1 }, { label: '+5', value: 5 }, { label: '+10', value: 10 }, { label: '++', value: 0 }].map((btn, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.quickBtn}
                            onPress={() => {
                                if (btn.value === 0) {
                                    const uncompleted = PRAYERS.find((p) => !isPrayerDone(p.key)) || PRAYERS[0];
                                    handlePrayerPress(uncompleted);
                                } else {
                                    handleQuickQada(btn.value);
                                }
                            }}
                        >
                            <Text style={styles.quickBtnText}>{btn.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {}
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>{i18n.t('qadaBalance')}</Text>
                    <Text style={styles.balanceNumber}>
                        {(qadaRemaining || 0).toLocaleString('en')} {i18n.t('qadaPrayers')}
                    </Text>
                </View>

                {}
                <TouchableOpacity style={styles.closeButton} onPress={handleDailyClose}>
                    <Text style={styles.closeButtonText}>{i18n.t('closeDayBtn')}</Text>
                </TouchableOpacity>

                <Text style={styles.completedText}>
                    {completedCount}/5 {i18n.t('prayersCompleted')}
                </Text>
            </ScrollView>

            {}
            <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={closeSheet}>
                <Pressable style={styles.overlay} onPress={closeSheet}>
                    <Pressable style={styles.sheetContainer} onPress={() => { }}>
                        <View style={styles.handleBar} />
                        {selectedPrayer && (
                            <>
                                <View style={styles.sheetHeader}>
                                    <TouchableOpacity onPress={closeSheet}>
                                        <Ionicons name="chevron-back" size={20} color="#2D6A6A" />
                                    </TouchableOpacity>
                                    <Text style={styles.sheetTitle}>
                                        {i18n.t('prayerOf')} {i18n.t(selectedPrayer.key)}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.markDoneRow}
                                    onPress={handleMarkPresent}
                                    disabled={actionLoading || isPrayerDone(selectedPrayer.key)}
                                >
                                    <View style={[styles.checkCircle, isPrayerDone(selectedPrayer.key) && styles.checkCircleDone]}>
                                        {isPrayerDone(selectedPrayer.key) && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                    </View>
                                    <Text style={[styles.markDoneText, isPrayerDone(selectedPrayer.key) && { color: '#2D6A6A' }]}>
                                        {isPrayerDone(selectedPrayer.key) ? i18n.t('prayerMarked') : i18n.t('prayedIt')}
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.separator} />
                                <Text style={styles.qadaSectionLabel}>{i18n.t('addQadaSection')}</Text>

                                <View style={styles.counterRow}>
                                    <TouchableOpacity style={styles.counterBtn} onPress={() => setQadaCount(qadaCount + 1)}>
                                        <Ionicons name="add" size={28} color="#2D6A6A" />
                                    </TouchableOpacity>
                                    <View style={styles.counterDisplay}>
                                        <Text style={styles.counterNumber}>{qadaCount}</Text>
                                    </View>
                                    <TouchableOpacity style={[styles.counterBtn, styles.counterBtnMinus]} onPress={() => setQadaCount(Math.max(1, qadaCount - 1))}>
                                        <Ionicons name="remove" size={28} color="#D9534F" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitBtn, actionLoading && { opacity: 0.6 }]}
                                    onPress={handleAddQada}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{i18n.t('confirm')}</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.undoBtn} onPress={handleUndo} disabled={actionLoading}>
                                    <Text style={styles.undoBtnText}>{i18n.t('undoAction')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F0E8' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#2D2D2D' },
    prayerList: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 6, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    prayerCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
    prayerLeft: { marginLeft: 'auto' },
    prayerRight: { marginRight: 0 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    prayerName: { fontSize: 17, fontWeight: '600', color: '#2D2D2D', flex: 1, textAlign: 'right', marginHorizontal: 12 },
    prayerNameDone: { color: '#2D6A6A' },
    emptyCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D0D0D0' },
    quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
    quickBtn: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    quickBtnText: { fontSize: 14, fontWeight: '700', color: '#2D6A6A' },
    balanceContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    balanceLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
    balanceNumber: { fontSize: 18, fontWeight: '700', color: '#2D6A6A' },
    closeButton: { backgroundColor: '#2D6A6A', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
    closeButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    completedText: { textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 10 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    sheetContainer: { backgroundColor: '#F5F0E8', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 },
    handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#C4C4C4', alignSelf: 'center', marginBottom: 16 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 20, gap: 8 },
    sheetTitle: { fontSize: 20, fontWeight: '700', color: '#2D2D2D' },
    markDoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginBottom: 16, paddingVertical: 8 },
    markDoneText: { fontSize: 16, fontWeight: '600', color: '#2D2D2D' },
    checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#2D6A6A', justifyContent: 'center', alignItems: 'center' },
    checkCircleDone: { backgroundColor: '#2D6A6A' },
    separator: { height: 1, backgroundColor: '#E0DCD4', marginVertical: 12 },
    qadaSectionLabel: { fontSize: 14, fontWeight: '600', color: '#888', textAlign: 'right', marginBottom: 16 },
    counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 },
    counterBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    counterBtnMinus: { borderWidth: 1, borderColor: '#F0E0E0' },
    counterDisplay: { width: 80, height: 50, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    counterNumber: { fontSize: 26, fontWeight: '800', color: '#2D2D2D' },
    submitBtn: { backgroundColor: '#2D6A6A', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
    submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    undoBtn: { alignItems: 'center', paddingVertical: 10 },
    undoBtnText: { fontSize: 14, fontWeight: '600', color: '#D9534F' },
});
