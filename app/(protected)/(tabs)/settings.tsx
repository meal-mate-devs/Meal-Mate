import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type SettingItemProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    onPress: () => void;
    isDestructive?: boolean;
};

export default function Settings() {
    const { useAuthContext } = require('@/context/authContext');
    const { logout } = useAuthContext();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await logout();
                            // After successful logout, redirect to login screen
                            router.replace('/');
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon, title, onPress, isDestructive = false }: SettingItemProps) => (
        <TouchableOpacity
            className={`flex-row items-center px-4 py-4 border-b border-gray-100`}
            onPress={onPress}
        >
            <Ionicons name={icon} size={24} color={isDestructive ? "#FF4444" : "#4A5568"} />
            <Text className={`flex-1 ml-3 text-lg ${isDestructive ? "text-red-500" : "text-gray-700"}`}>
                {title}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView>
                <View className="pt-4">
                    {/* Profile Section */}
                    <View className="bg-white mb-4 px-4 py-6">
                        <View className="items-center">
                            <View className="w-24 h-24 rounded-full bg-gray-200 mb-4" />
                            <Text className="text-xl font-semibold text-gray-800">Mark Johnson</Text>
                            <Text className="text-gray-500">mark@example.com</Text>
                        </View>
                    </View>

                    {/* Account Settings */}
                    <View className="bg-white mb-4">
                        <Text className="px-4 py-2 text-sm font-medium text-gray-500 uppercase">
                            Account Settings
                        </Text>
                        <SettingItem
                            icon="person-outline"
                            title="Edit Profile"
                            onPress={() => {}}
                        />
                        <SettingItem
                            icon="notifications-outline"
                            title="Notifications"
                            onPress={() => {}}
                        />
                        <SettingItem
                            icon="lock-closed-outline"
                            title="Privacy"
                            onPress={() => {}}
                        />
                    </View>

                    {/* App Settings */}
                    <View className="bg-white mb-4">
                        <Text className="px-4 py-2 text-sm font-medium text-gray-500 uppercase">
                            App Settings
                        </Text>
                        <SettingItem
                            icon="language-outline"
                            title="Language"
                            onPress={() => {}}
                        />
                        <SettingItem
                            icon="moon-outline"
                            title="Dark Mode"
                            onPress={() => {}}
                        />
                    </View>

                    {/* Support */}
                    <View className="bg-white mb-4">
                        <Text className="px-4 py-2 text-sm font-medium text-gray-500 uppercase">
                            Support
                        </Text>
                        <SettingItem
                            icon="help-circle-outline"
                            title="Help Center"
                            onPress={() => {}}
                        />
                        <SettingItem
                            icon="information-circle-outline"
                            title="About"
                            onPress={() => {}}
                        />
                    </View>

                    {/* Logout */}
                    <View className="bg-white">
                        <SettingItem
                            icon="log-out-outline"
                            title={isLoading ? "Logging out..." : "Logout"}
                            onPress={handleLogout}
                            isDestructive={true}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}