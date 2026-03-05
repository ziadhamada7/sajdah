import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usePrayerStore from '../../src/stores/prayerStore';
import useAuthStore from '../../src/stores/authStore';
import useSettingsStore from '../../src/stores/settingsStore';
import i18n from '../../src/i18n';

const { width } = Dimensions.get('window');
const DAYS_LABELS_AR = ['ش', 'ج', 'خ', 'أ', 'ث', 'إ', 'س'];
const DAYS_LABELS_EN = ['Sa', 'Fr', 'Th', 'We', 'Tu', 'Mo', 'Su'];

const DEFAULT_QADA_PER_PRAYER = 7;
const DEFAULT_DAILY_PACE = DEFAULT_QADA_PER_PRAYER * 5;

export default function ProgressScreen() {
    const { qadaRemaining, stats, loadStats } = usePrayerStore();
    const { isGuest, token } = useAuthStore();
    const { language, langVersion } = useSettingsStore();
    const [initialEstimate, setInitialEstimate] = useState(8000);

    const DAYS_LABELS = language === 'ar' ? DAYS_LABELS_AR : DAYS_LABELS_EN;

    useEffect(() => {
        if (token && !isGuest) loadStats();
        loadInitialEstimate();
    }, [token, isGuest]);

    const loadInitialEstimate = async () => {
        try {
            const saved = await AsyncStorage.getItem('qada_initial_estimate');
            if (saved) setInitialEstimate(parseInt(saved));
        } catch { }
    };

    const actualAvg = stats?.avgPerDay || 0;
    const effectivePace = actualAvg > 0 ? actualAvg : DEFAULT_DAILY_PACE;
    const daysToFinish = effectivePace > 0 ? Math.ceil(qadaRemaining / effectivePace) : 0;

    const getFinishDate = () => {
        if (daysToFinish <= 0 || qadaRemaining <= 0) return null;
        const d = new Date();
        d.setDate(d.getDate() + daysToFinish);
        return d;
    };

    const finishDate = getFinishDate();
    const dateLocale = language === 'ar' ? 'ar-EG' : 'en-US';
    const finishDateStr = finishDate
        ? finishDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    const totalDone = initialEstimate - qadaRemaining;
    const progressPct = initialEstimate > 0 ? Math.min(100, Math.max(2, (totalDone / initialEstimate) * 100)) : 2;

    const dailyData = stats?.dailyBreakdown || [];
    const maxCount = Math.max(...dailyData.map((d) => d.count), 1);
    const chartData = dailyData.slice(-7);

    const getPaceStatus = () => {
        if (actualAvg <= 0) return { text: `${i18n.t('paceTarget')} ${DEFAULT_DAILY_PACE} ${i18n.t('qadaPerDay')}`, color: '#888' };
        if (actualAvg >= DEFAULT_DAILY_PACE) return { text: `${i18n.t('paceExcellent')} ${actualAvg} ${i18n.t('qadaPerDay')}`, color: '#2D6A6A' };
        if (actualAvg >= DEFAULT_DAILY_PACE * 0.7) return { text: `${i18n.t('paceGood')} ${actualAvg} ${i18n.t('qadaPerDay')}`, color: '#D4A574' };
        return { text: `${i18n.t('paceSlow')} ${actualAvg} — ${i18n.t('tryMore')}`, color: '#D9534F' };
    };

    const paceStatus = getPaceStatus();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <View style={styles.moonContainer}>
                        <Ionicons name="moon" size={32} color="#A8D8D8" />
                        <View style={styles.stars}>
                            <Text style={styles.star}>✦</Text>
                            <Text style={[styles.star, { marginLeft: 20, marginTop: -10 }]}>✦</Text>
                            <Text style={[styles.star, { marginLeft: 8, marginTop: 5 }]}>✧</Text>
                        </View>
                    </View>

                    <View style={styles.headerTitleRow}>
                        <Ionicons name="chevron-back" size={18} color="#A8D8D8" />
                        <Text style={styles.headerTitle}>{i18n.t('progress')}</Text>
                    </View>

                    <View style={styles.bigNumberContainer}>
                        <Text style={styles.bigNumber}>{(qadaRemaining || 0).toLocaleString('en')}</Text>
                    </View>

                    <View style={styles.subtitleRow}>
                        <Ionicons name="calendar-outline" size={14} color="#A8D8D8" />
                        <Text style={styles.subtitle}>
                            {i18n.t('lastUpdated')} {new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>

                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
                            <Text style={styles.progressTotal}>{i18n.t('fromTotal').replace('{{total}}', initialEstimate.toLocaleString('en'))}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.chartSection}>
                    {chartData.length > 0 ? (
                        <View style={styles.chartContainer}>
                            {chartData.map((item, index) => {
                                const barHeight = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                return (
                                    <View key={index} style={styles.barColumn}>
                                        <View style={styles.barWrapper}>
                                            <Text style={styles.barValue}>{item.count > 0 ? item.count : ''}</Text>
                                            <View style={[styles.bar, { height: Math.max(barHeight, 4), backgroundColor: item.count > 0 ? '#2D6A6A' : '#D5D0C8' }]} />
                                        </View>
                                        <Text style={styles.barLabel}>{DAYS_LABELS[index % 7]}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Ionicons name="bar-chart-outline" size={32} color="#D5D0C8" />
                            <Text style={styles.emptyChartText}>{i18n.t('chartWillAppear')}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.statsSection}>
                    <Text style={styles.statsTitle}>{i18n.t('dailyStats')}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Ionicons name="trending-up" size={20} color="#2D6A6A" />
                            <Text style={styles.statValue}>{actualAvg > 0 ? actualAvg : DEFAULT_DAILY_PACE}</Text>
                            <Text style={styles.statLabel}>{i18n.t('avgPerDay')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="flag" size={20} color="#D4A574" />
                            <Text style={styles.statValueSmall}>{finishDateStr}</Text>
                            <Text style={styles.statLabel}>{i18n.t('estimatedFinish')}</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Ionicons name="time-outline" size={20} color="#7B6B8D" />
                            <Text style={styles.statValue}>{daysToFinish > 0 ? daysToFinish : '—'}</Text>
                            <Text style={styles.statLabel}>{i18n.t('daysRemaining')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="speedometer-outline" size={20} color={paceStatus.color} />
                            <Text style={[styles.statValueSmall, { color: paceStatus.color }]}>{paceStatus.text}</Text>
                            <Text style={styles.statLabel}>{i18n.t('currentPace')}</Text>
                        </View>
                    </View>

                    <View style={styles.qadaBadge}>
                        <View style={styles.qadaBadgeIcon}><Ionicons name="moon" size={16} color="#2D6A6A" /></View>
                        <Text style={styles.qadaBadgeText}>{stats?.totalQadaLast14Days || 0} {i18n.t('qadaPrayers')} {i18n.t('last14Days')}</Text>
                    </View>

                    <View style={styles.paceExplainer}>
                        <Ionicons name="information-circle-outline" size={16} color="#999" />
                        <Text style={styles.paceExplainerText}>
                            {i18n.t('paceExplain').replace('{{perPrayer}}', DEFAULT_QADA_PER_PRAYER).replace('{{daily}}', DEFAULT_DAILY_PACE)}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F0E8' },
    headerSection: { backgroundColor: '#2D6A6A', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center' },
    moonContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    stars: { flexDirection: 'row', marginLeft: 8, marginTop: -5 },
    star: { color: '#A8D8D8', fontSize: 10 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    bigNumberContainer: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 40, marginBottom: 12 },
    bigNumber: { fontSize: 48, fontWeight: '800', color: '#FFF', textAlign: 'center' },
    subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    subtitle: { fontSize: 12, color: '#A8D8D8' },
    progressBarContainer: { width: '100%', paddingHorizontal: 10 },
    progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#A8D8D8', borderRadius: 3 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    progressPct: { fontSize: 11, color: '#A8D8D8', fontWeight: '600' },
    progressTotal: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    chartSection: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: -16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 140 },
    barColumn: { alignItems: 'center', flex: 1 },
    barWrapper: { height: 120, justifyContent: 'flex-end', alignItems: 'center' },
    barValue: { fontSize: 10, color: '#2D6A6A', fontWeight: '700', marginBottom: 4 },
    bar: { width: 20, borderRadius: 6, minHeight: 4 },
    barLabel: { marginTop: 6, fontSize: 12, color: '#888', fontWeight: '500' },
    emptyChart: { alignItems: 'center', justifyContent: 'center', height: 120, gap: 8 },
    emptyChartText: { fontSize: 13, color: '#BBB' },
    statsSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
    statsTitle: { fontSize: 16, fontWeight: '700', color: '#2D2D2D', textAlign: 'right', marginBottom: 16 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    statValue: { fontSize: 20, fontWeight: '800', color: '#2D2D2D', marginTop: 8 },
    statValueSmall: { fontSize: 14, fontWeight: '700', color: '#2D2D2D', marginTop: 8, textAlign: 'center' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
    qadaBadge: { backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, marginBottom: 12 },
    qadaBadgeIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F4F4', justifyContent: 'center', alignItems: 'center' },
    qadaBadgeText: { fontSize: 14, fontWeight: '600', color: '#2D6A6A' },
    paceExplainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingVertical: 8 },
    paceExplainerText: { fontSize: 11, color: '#999', textAlign: 'right' },
});
