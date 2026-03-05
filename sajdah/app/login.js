import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/stores/authStore';
import i18n from '../src/i18n';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(i18n.t('error'), 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert(
                i18n.t('error'),
                error.response?.data?.error || 'Login failed'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {}
                <View style={styles.header}>
                    <Text style={styles.title}>{i18n.t('login')}</Text>
                    <Text style={styles.subtitle}>{i18n.t('appName')}</Text>
                </View>

                {}
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{i18n.t('email')}</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="email@example.com"
                            placeholderTextColor="#999"
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{i18n.t('password')}</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholder="••••••"
                            placeholderTextColor="#999"
                            textAlign="right"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.loginBtnText}>{i18n.t('login')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {}
                <View style={styles.links}>
                    <TouchableOpacity onPress={() => router.push('/register')}>
                        <Text style={styles.linkText}>{i18n.t('noAccount')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>{i18n.t('guestMode')}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F0E8',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D6A6A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
    },
    form: {
        gap: 16,
        marginBottom: 24,
    },
    inputContainer: {
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D2D2D',
        textAlign: 'right',
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        fontSize: 15,
        color: '#2D2D2D',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    loginBtn: {
        backgroundColor: '#2D6A6A',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    links: {
        alignItems: 'center',
        gap: 16,
    },
    linkText: {
        fontSize: 14,
        color: '#2D6A6A',
        fontWeight: '500',
    },
    backText: {
        fontSize: 14,
        color: '#888',
    },
});
