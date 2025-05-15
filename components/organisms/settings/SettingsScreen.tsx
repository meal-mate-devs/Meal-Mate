import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SettingItem {
    id: string;
    title: string;
    subtitle?: string;
    link: any;
    showBadge?: boolean;
    icon?: string;
}

const SettingsScreen: React.FC = () => {
    const router = useRouter();

    const accountItems: SettingItem[] = [
        {
            id: 'profile',
            title: 'Max Mustermann',
            subtitle: 'max@mustermann.com',
            link: '/settings/profile',
            showBadge: false,
        },
        {
            id: 'subscription',
            title: 'Pro Subscription',
            subtitle: 'valid until 03/24',
            link: '/settings/subscription',
            showBadge: true,
        },
    ];

    const devicesItems: SettingItem[] = [
        {
            id: 'iphone',
            title: 'Max Mustermann\'s iPhone 13 Pro',
            link: '/settings/device-details',
        },
        {
            id: 'amazon',
            title: 'Mustermann\'s Amazon Fire TV',
            link: '/settings/device-details',
        },
    ];

    const appSettingsItems: SettingItem[] = [
        {
            id: 'general',
            icon: 'settings',
            title: 'General',
            link: '/settings/general',
        },
        {
            id: 'privacy',
            icon: 'shield',
            title: 'Privacy',
            link: '/settings/privacy',
        },
        {
            id: 'notifications',
            icon: 'bell',
            title: 'Notifications',
            link: '/settings/notifications',
        },
        {
            id: 'payment',
            icon: 'credit-card',
            title: 'Payment',
            link: '/settings/payment',
        },
    ];

    const renderSettingItem = (item: SettingItem, hasIcon: boolean = false) => (
        <TouchableOpacity
            key={item.id}
            className="flex-row items-center justify-between py-3"
            onPress={() => router.push(item.link)}
        >
            <View className="flex-row items-center">
                {hasIcon && item.icon && (
                    <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                        <Feather name={item.icon as any} size={16} color="#666" />
                    </View>
                )}
                <View>
                    <Text className="text-gray-800 font-medium">{item.title}</Text>
                    {item.subtitle && (
                        <Text className="text-gray-500 text-sm">{item.subtitle}</Text>
                    )}
                </View>
            </View>
            <View className="flex-row items-center">
                {item.showBadge && (
                    <View className="h-4 w-4 rounded-full bg-green-500 mr-2" />
                )}
                <Feather name="chevron-right" size={20} color="#ccc" />
            </View>
        </TouchableOpacity>
    );

    const renderSettingsSection = (title: string | null, items: SettingItem[], hasIcon: boolean = false) => (
        <View className="mb-6">
            {title && <Text className="text-gray-500 text-sm mb-1">{title}</Text>}
            <View className="bg-gray-100 rounded-xl p-3">
                {items.map((item) => renderSettingItem(item, hasIcon))}
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            <View className="px-4 py-4">
                <Text className="text-xl font-bold text-gray-800">Settings</Text>
            </View>

            <ScrollView className="flex-1 px-4">
                {renderSettingsSection('Account', accountItems)}
                {renderSettingsSection('Devices', devicesItems)}
                {renderSettingsSection('App Settings', appSettingsItems, true)}
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;