import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import i18n from '../../src/i18n';
import useSettingsStore from '../../src/stores/settingsStore';

export default function TabLayout() {
    
    const langVersion = useSettingsStore((s) => s.langVersion);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#2D6A6A',
                tabBarInactiveTintColor: '#999',
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: i18n.t('today'),
                    tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="progress"
                options={{
                    title: i18n.t('progress'),
                    tabBarIcon: ({ color }) => <Ionicons name="trending-up" size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: i18n.t('history'),
                    tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: i18n.t('settings'),
                    tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        height: 65,
        paddingBottom: 8,
        paddingTop: 8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
});
