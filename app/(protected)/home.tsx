import { useAuthContext } from '@/context/authContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function home() {
    const { user, logout } = useAuthContext();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoading(true)
        try {
            await logout();
            router.push("/login")
        } catch (error) {
            Alert.alert("erorr while logout !")
        } finally {
            setIsLoading(false);
        }
    }

    const sections = [
        { title: 'My Profile', icon: '👤', action: () => console.log('Navigate to profile') },
        { title: 'Settings', icon: '⚙️', action: () => console.log('Navigate to settings') },
        { title: 'Notifications', icon: '🔔', action: () => console.log('Navigate to notifications') },
        { title: 'Help & Support', icon: '❓', action: () => console.log('Navigate to help') },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

            <View className="bg-blue-600 px-6 pt-2 pb-6">
                <View className="flex-row items-center justify-between mb-6 mt-4">
                    <Text className="text-3xl font-bold text-white">Home</Text>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-700 py-2 px-4 rounded-lg"
                    >
                        <Text className="text-white font-medium">{!isLoading ? "Logout" : "Logging out....."}</Text>
                    </TouchableOpacity>
                </View>

                <View className="bg-white rounded-2xl p-5 shadow-md">
                    <View className="flex-row items-center">
                        <View className="w-16 h-16 rounded-full bg-blue-100 mr-4 items-center justify-center">
                            <Text className="text-blue-600 text-2xl font-bold">
                                {user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </Text>
                        </View>

                        <View className="flex-1">
                            <Text className="text-xl font-bold text-gray-800 mb-1">{user?.displayName || "User"}</Text>
                            <Text className="text-gray-500">{user?.email}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Access</Text>

                <View className="space-y-3 mb-8">
                    {sections.map((section, index) => (
                        <TouchableOpacity
                            key={index}
                            className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-100"
                            onPress={section.action}
                        >
                            <Text className="text-2xl mr-3">{section.icon}</Text>
                            <Text className="text-base font-medium text-gray-800">{section.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-6">
                    <Text className="text-lg font-bold text-blue-800 mb-2">Welcome to MealMate!</Text>
                    <Text className="text-blue-700">
                        Thank you for joining us. Explore the app and customize your experience.
                    </Text>
                </View>

                <Text className="text-lg font-semibold text-gray-800 mb-4">Your Activity</Text>
                <View className="flex-row justify-between mb-8">
                    <View className="bg-gray-50 rounded-xl p-4 w-[48%] items-center border border-gray-100">
                        <Text className="text-3xl font-bold text-blue-600 mb-1">0</Text>
                        <Text className="text-gray-500 text-center">Completed Tasks</Text>
                    </View>
                    <View className="bg-gray-50 rounded-xl p-4 w-[48%] items-center border border-gray-100">
                        <Text className="text-3xl font-bold text-blue-600 mb-1">0</Text>
                        <Text className="text-gray-500 text-center">Active Projects</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};