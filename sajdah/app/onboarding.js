import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Dimensions,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../src/stores/authStore';
import useSettingsStore from '../src/stores/settingsStore';
import i18n from '../src/i18n';
import { requestPermissions } from '../src/utils/notifications';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();
    const { setGuest } = useAuthStore();
    const { completeOnboarding } = useSettingsStore();
    const [step, setStep] = useState(0);

    
    const [startOption, setStartOption] = useState('today');

    
    const [qadaEstimate, setQadaEstimate] = useState('8000');
    const [pace, setPace] = useState('medium');

    
    const [notifEnabled, setNotifEnabled] = useState(true);

    const handleNext = async () => {
        if (step < 2) {
            setStep(step + 1);
            return;
        }

        
        try {
            if (notifEnabled) {
                await requestPermissions();
            }

            
            const estimate = parseInt(qadaEstimate) || 8000;
            const today = new Date().toISOString().split('T')[0];
            const guestData = {
                date: today,
                presentDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
                qadaRemaining: estimate,
            };
            await AsyncStorage.setItem('guest_today', JSON.stringify(guestData));
            await AsyncStorage.setItem('qada_initial_estimate', String(estimate));

            await completeOnboarding();
            await setGuest();
            router.replace('/(tabs)');
        } catch (error) {
            console.log('Onboarding error:', error);
            
            router.replace('/(tabs)');
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const renderStep0 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.question}>{i18n.t('onboardingQ1')}</Text>

            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={[styles.optionCard, startOption === 'today' && styles.optionCardActive]}
                    onPress={() => setStartOption('today')}
                >
                    <View style={styles.optionRow}>
                        <View style={[styles.radioCircle, startOption === 'today' && styles.radioActive]}>
                            {startOption === 'today' && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={styles.optionText}>{i18n.t('fromToday')}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.optionCard, startOption === 'date' && styles.optionCardActive]}
                    onPress={() => setStartOption('date')}
                >
                    <View style={styles.optionRow}>
                        <View style={[styles.radioCircle, startOption === 'date' && styles.radioActive]}>
                            {startOption === 'date' && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={styles.optionText}>{i18n.t('fromDate')}</Text>
                    </View>
                </TouchableOpacity>

                {startOption === 'date' && (
                    <View style={styles.dateInputRow}>
                        <Ionicons name="calendar-outline" size={20} color="#999" />
                        <TextInput
                            style={styles.dateInput}
                            placeholder={i18n.t('selectDate')}
                            placeholderTextColor="#999"
                        />
                    </View>
                )}
            </View>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.question}>{i18n.t('onboardingQ2')}</Text>

            <View style={styles.estimateContainer}>
                <TextInput
                    style={styles.estimateInput}
                    value={qadaEstimate}
                    onChangeText={(text) => setQadaEstimate(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    textAlign="center"
                    selectTextOnFocus
                />
                <Text style={styles.estimateLabel}>{i18n.t('qadaPrayers')}</Text>
            </View>

            <Text style={styles.paceLabel}>{i18n.t('pace')}</Text>

            <View style={styles.paceRow}>
                {[
                    { key: 'easy', label: '1-3 يوميًا' },
                    { key: 'medium', label: '4-6 يوميًا' },
                    { key: 'hard', label: '7+ يوميًا' },
                ].map((p) => (
                    <TouchableOpacity
                        key={p.key}
                        style={[styles.paceBtn, pace === p.key && styles.paceBtnActive]}
                        onPress={() => setPace(p.key)}
                    >
                        <Text style={[styles.paceBtnText, pace === p.key && styles.paceBtnTextActive]}>
                            {i18n.t(p.key)}
                        </Text>
                        <Text style={[styles.paceSubText, pace === p.key && styles.paceBtnTextActive]}>
                            {p.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.paceNote}>{i18n.t('steadyPace')}</Text>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.question}>{i18n.t('onboardingQ3')}</Text>

            {}
            <View style={styles.bellContainer}>
                <View style={styles.bellCircle}>
                    <Ionicons name="notifications" size={40} color="#2D6A6A" />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.notifOption, notifEnabled && styles.notifOptionActive]}
                onPress={() => setNotifEnabled(true)}
            >
                <View style={[styles.radioCircle, notifEnabled && styles.radioActive]}>
                    {notifEnabled && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={styles.notifOptionText}>{i18n.t('enableNotifications')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.notifOption, !notifEnabled && styles.notifOptionActive]}
                onPress={() => setNotifEnabled(false)}
            >
                <View style={[styles.radioCircle, !notifEnabled && styles.radioActive]}>
                    {!notifEnabled && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={styles.notifSkipText}>{i18n.t('skipNotifications')}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {}
                {step > 0 && (
                    <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                        <Ionicons name="arrow-forward" size={24} color="#2D6A6A" />
                    </TouchableOpacity>
                )}

                {}
                <View style={styles.dotsRow}>
                    {[0, 1, 2].map((i) => (
                        <View
                            key={i}
                            style={[styles.dot, step === i && styles.dotActive, step > i && styles.dotCompleted]}
                        />
                    ))}
                </View>

                {}
                {step === 0 && renderStep0()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}

                {}
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>
                        {step === 2 ? i18n.t('allow') : i18n.t('next')}
                    </Text>
                </TouchableOpacity>

                {}
                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => router.push('/login')}
                >
                    <Text style={styles.loginLinkText}>{i18n.t('hasAccount')}</Text>
                </TouchableOpacity>
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
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    backBtn: {
        alignSelf: 'flex-end',
        marginBottom: 16,
    },
    
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D5D0C8',
    },
    dotActive: {
        backgroundColor: '#2D6A6A',
        width: 24,
    },
    dotCompleted: {
        backgroundColor: '#2D6A6A',
    },
    
    stepContent: {
        flex: 1,
        alignItems: 'center',
        marginBottom: 40,
    },
    question: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D2D2D',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 32,
    },
    
    optionsContainer: {
        width: '100%',
        gap: 12,
    },
    optionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    optionCardActive: {
        borderColor: '#2D6A6A',
        backgroundColor: '#F0FAF8',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D5D0C8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        backgroundColor: '#2D6A6A',
        borderColor: '#2D6A6A',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D2D2D',
    },
    dateInputRow: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 10,
        justifyContent: 'flex-end',
    },
    dateInput: {
        flex: 1,
        fontSize: 14,
        color: '#2D2D2D',
        textAlign: 'right',
    },
    
    estimateContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 40,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    estimateInput: {
        fontSize: 36,
        fontWeight: '800',
        color: '#2D2D2D',
        minWidth: 120,
    },
    estimateLabel: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    paceLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 12,
    },
    paceRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    paceBtn: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        flex: 1,
    },
    paceBtnActive: {
        borderColor: '#2D6A6A',
        backgroundColor: '#E8F4F4',
    },
    paceBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
    },
    paceSubText: {
        fontSize: 10,
        color: '#AAA',
        marginTop: 2,
    },
    paceBtnTextActive: {
        color: '#2D6A6A',
    },
    paceNote: {
        fontSize: 12,
        color: '#999',
    },
    
    bellContainer: {
        marginBottom: 32,
    },
    bellCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F4F4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifOption: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    notifOptionActive: {
        borderColor: '#2D6A6A',
        backgroundColor: '#F0FAF8',
    },
    notifOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D2D2D',
    },
    notifSkipText: {
        fontSize: 14,
        color: '#888',
    },
    
    nextBtn: {
        backgroundColor: '#2D6A6A',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    nextBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    loginLink: {
        alignItems: 'center',
    },
    loginLinkText: {
        fontSize: 14,
        color: '#2D6A6A',
        fontWeight: '500',
    },
});
