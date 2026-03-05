import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import usePrayerStore from '../../src/stores/prayerStore';
import useAuthStore from '../../src/stores/authStore';
import useSettingsStore from '../../src/stores/settingsStore';
import i18n from '../../src/i18n';

const WEEKDAY_LABELS_AR = ['س', 'إ', 'ث', 'أ', 'خ', 'ج', 'ش'];
const WEEKDAY_LABELS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function HistoryScreen() {
    const { history, loadHistory } = usePrayerStore();
    const { isGuest, token } = useAuthStore();
    const { language, langVersion } = useSettingsStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const WEEKDAY_LABELS = language === 'ar' ? WEEKDAY_LABELS_AR : WEEKDAY_LABELS_EN;
    const dateLocale = language === 'ar' ? 'ar-EG' : 'en-US';

    useEffect(() => {
        if (token && !isGuest) {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month + 1, 0).getDate();
            const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            loadHistory(from, to);
        }
    }, [token, isGuest, currentMonth]);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    
    const startOffset = (firstDayOfMonth + 1) % 7;

    const calendarDays = [];
    for (let i = 0; i < startOffset; i++) {
        calendarDays.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        calendarDays.push(d);
    }

    
    const getDayData = (day) => {
        if (!day) return null;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return history.find((h) => h.date === dateStr);
    };

    
    const getDayColor = (day) => {
        const data = getDayData(day);
        if (!data) return 'transparent';
        if (data.presentCompleted === 5) return '#2D6A6A'; 
        if (data.presentCompleted >= 3) return '#5B9A8B'; 
        if (data.presentCompleted >= 1) return '#D4A574'; 
        if (data.conversionsAdded > 0) return '#D9534F'; 
        return 'transparent';
    };

    
    const totalPresent = history.reduce((s, h) => s + (h.presentCompleted || 0), 0);
    const totalQada = history.reduce((s, h) => s + (h.qadaDone || 0), 0);

    const monthName = currentMonth.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {}
                <View style={styles.header}>
                    <Ionicons name="chevron-back" size={18} color="#2D6A6A" />
                    <Text style={styles.headerTitle}>{i18n.t('history')}</Text>
                </View>

                {}
                <View style={styles.calendarCard}>
                    {}
                    <View style={styles.monthRow}>
                        <TouchableOpacity onPress={nextMonth}>
                            <Ionicons name="chevron-forward" size={20} color="#2D6A6A" />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>{monthName}</Text>
                        <TouchableOpacity onPress={prevMonth}>
                            <Ionicons name="chevron-back" size={20} color="#2D6A6A" />
                        </TouchableOpacity>
                    </View>

                    {}
                    <View style={styles.weekdayRow}>
                        {WEEKDAY_LABELS.map((label, i) => (
                            <Text key={i} style={styles.weekdayLabel}>{label}</Text>
                        ))}
                    </View>

                    {}
                    <View style={styles.calendarGrid}>
                        {calendarDays.map((day, index) => {
                            const dayColor = getDayColor(day);
                            const isToday =
                                day === new Date().getDate() &&
                                month === new Date().getMonth() &&
                                year === new Date().getFullYear();

                            return (
                                <View key={index} style={styles.dayCell}>
                                    {day ? (
                                        <View
                                            style={[
                                                styles.dayCircle,
                                                dayColor !== 'transparent' && { backgroundColor: dayColor },
                                                isToday && styles.todayCircle,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayText,
                                                    dayColor !== 'transparent' && styles.dayTextWhite,
                                                    isToday && styles.todayText,
                                                ]}
                                            >
                                                {day}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {}
                <View style={styles.summarySection}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryIcon}>
                            <Ionicons name="checkmark-circle" size={18} color="#2D6A6A" />
                        </View>
                        <Text style={styles.summaryText}>
                            {totalPresent} {i18n.t('presentCompleted')}
                        </Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#FDE8E8' }]}>
                            <Ionicons name="close-circle" size={18} color="#D9534F" />
                        </View>
                        <Text style={styles.summaryText}>
                            {totalQada} {i18n.t('qadaDone')}
                        </Text>
                    </View>
                </View>

                {}
                <View style={styles.historyList}>
                    {history.slice(0, 7).map((item, index) => (
                        <View key={index} style={styles.historyRow}>
                            <View style={styles.historyDots}>
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.historyDot,
                                            {
                                                backgroundColor:
                                                    i < (item.presentCompleted || 0) ? '#2D6A6A' : '#D5D0C8',
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={styles.historyDate}>
                                {new Date(item.date).toLocaleDateString(dateLocale, {
                                    weekday: 'short',
                                    day: 'numeric',
                                })}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F0E8',
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 30,
    },
    
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D2D2D',
    },
    
    calendarCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20,
    },
    monthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D2D2D',
    },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekdayLabel: {
        width: 36,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 2,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    todayCircle: {
        borderWidth: 2,
        borderColor: '#2D6A6A',
    },
    dayText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#2D2D2D',
    },
    dayTextWhite: {
        color: '#FFF',
        fontWeight: '700',
    },
    todayText: {
        fontWeight: '700',
        color: '#2D6A6A',
    },
    
    summarySection: {
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E8F4F4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D2D2D',
    },
    
    historyList: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F0EDE6',
    },
    historyDate: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    historyDots: {
        flexDirection: 'row',
        gap: 4,
    },
    historyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
