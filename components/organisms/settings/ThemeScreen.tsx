"use client"

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

type ThemeOption = 'light' | 'dark' | 'system';

const ThemeScreen: React.FC = () => {
    const router = useRouter();
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('dark');

    const themeOptions = [
        {
            id: 'light' as ThemeOption,
            title: 'Light',
            subtitle: 'Bright and clean interface',
            icon: 'sunny-outline',
            iconColor: '#FACC15',
        },
        {
            id: 'dark' as ThemeOption,
            title: 'Dark',
            subtitle: 'Easy on the eyes',
            icon: 'moon-outline',
            iconColor: '#8B5CF6',
        },
        {
            id: 'system' as ThemeOption,
            title: 'System',
            subtitle: 'Follow device settings',
            icon: 'phone-portrait-outline',
            iconColor: '#3B82F6',
        },
    ];

    const handleThemeSelect = (theme: ThemeOption) => {
        setSelectedTheme(theme);
        // TODO: Implement theme switching logic with context/state management
        console.log('Theme selected:', theme);
    };

    return (
        <LinearGradient
            colors={["#09090b", "#18181b"]}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

                {/* Header */}
                <View style={{ paddingTop: 44 }} className="px-4 pb-6">
                    <View className="flex-row items-center justify-between mb-2">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-bold">Theme</Text>
                        <View className="w-6" />
                    </View>
                    <Text className="text-gray-400 text-center">Choose your preferred theme</Text>
                </View>

                <ScrollView
                    className="flex-1 px-4"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Theme Options */}
                    <View className="mb-6">
                        <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">
                            Appearance
                        </Text>
                        <View className="bg-zinc-800 rounded-2xl overflow-hidden">
                            {themeOptions.map((option, index) => (
                                <View key={option.id}>
                                    <TouchableOpacity
                                        className="flex-row items-center justify-between py-4 px-4"
                                        onPress={() => handleThemeSelect(option.id)}
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <View
                                                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                                                style={{ backgroundColor: `${option.iconColor}20` }}
                                            >
                                                <Ionicons name={option.icon as any} size={24} color={option.iconColor} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white font-semibold text-base">{option.title}</Text>
                                                <Text className="text-gray-400 text-sm mt-1">{option.subtitle}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center">
                                            {selectedTheme === option.id ? (
                                                <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: option.iconColor }}>
                                                    <Ionicons name="checkmark" size={16} color="white" />
                                                </View>
                                            ) : (
                                                <View className="w-6 h-6 rounded-full border-2 border-gray-600" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                    {index !== themeOptions.length - 1 && <View className="h-px bg-zinc-700 ml-16" />}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Theme Preview */}
                    <View className="mb-6">
                        <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">
                            Preview
                        </Text>
                        <View className="bg-zinc-800 rounded-2xl p-6">
                            <View className="items-center">
                                <View className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl items-center justify-center mb-4">
                                    <Ionicons name="restaurant" size={40} color="white" />
                                </View>
                                <Text className="text-white font-bold text-xl mb-2">Meal Mate</Text>
                                <Text className="text-gray-400 text-sm text-center">
                                    This is how the app will look with the {selectedTheme} theme
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Info */}
                    <View className="bg-zinc-800/50 rounded-2xl p-4 mb-8">
                        <View className="flex-row items-start">
                            <Ionicons name="information-circle-outline" size={20} color="#FACC15" />
                            <View className="flex-1 ml-3">
                                <Text className="text-gray-300 text-sm leading-6">
                                    The theme will be applied across the entire app. System theme follows your device's appearance settings.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default ThemeScreen;
