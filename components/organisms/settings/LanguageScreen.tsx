"use client"

import { useLanguage } from "@/context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

type Language = {
    id: string;
    name: string;
    nativeName: string;
    icon: string;
};

const LanguageScreen: React.FC = () => {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();

    const languages: Language[] = [
        {
            id: 'en',
            name: 'English',
            nativeName: 'English',
            icon: '🇺🇸',
        },
        {
            id: 'es',
            name: 'Spanish',
            nativeName: 'Español',
            icon: '🇪🇸',
        },
        {
            id: 'fr',
            name: 'French',
            nativeName: 'Français',
            icon: '🇫🇷',
        },
        {
            id: 'de',
            name: 'German',
            nativeName: 'Deutsch',
            icon: '🇩🇪',
        },
        {
            id: 'it',
            name: 'Italian',
            nativeName: 'Italiano',
            icon: '🇮🇹',
        },
        {
            id: 'pt',
            name: 'Portuguese',
            nativeName: 'Português',
            icon: '🇵🇹',
        },
        {
            id: 'ja',
            name: 'Japanese',
            nativeName: '日本語',
            icon: '🇯🇵',
        },
        {
            id: 'ko',
            name: 'Korean',
            nativeName: '한국어',
            icon: '🇰🇷',
        },
        {
            id: 'zh',
            name: 'Chinese',
            nativeName: '中文',
            icon: '🇨🇳',
        },
        {
            id: 'ar',
            name: 'Arabic',
            nativeName: 'العربية',
            icon: '🇸🇦',
        },
        {
            id: 'hi',
            name: 'Hindi',
            nativeName: 'हिन्दी',
            icon: '🇮🇳',
        },
        {
            id: 'ru',
            name: 'Russian',
            nativeName: 'Русский',
            icon: '🇷🇺',
        },
    ];

    const handleLanguageSelect = async (languageId: string) => {
        if (languageId === language) return; // Already selected

        await setLanguage(languageId as any);

        Alert.alert(
            t('common.confirm'),
            t('language.infoText'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('common.confirm'),
                    onPress: () => {
                        // For now, just show that language was changed
                        // In a production app, you might want to restart the app
                        Alert.alert(
                            t('common.success'),
                            'Language changed successfully. Please restart the app to see all changes.',
                            [{ text: t('common.ok') }]
                        );
                    },
                },
            ]
        );
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
                        <Text className="text-white text-xl font-bold">{t('language.title')}</Text>
                        <View className="w-6" />
                    </View>
                    <Text className="text-gray-400 text-center">{t('language.subtitle')}</Text>
                </View>

                <ScrollView
                    className="flex-1 px-4"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Language Options */}
                    <View className="mb-6">
                        <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">
                            {t('language.availableLanguages')}
                        </Text>
                        <View className="bg-zinc-800 rounded-2xl overflow-hidden">
                            {languages.map((lang, index) => (
                                <View key={lang.id}>
                                    <TouchableOpacity
                                        className="flex-row items-center justify-between py-4 px-4"
                                        onPress={() => handleLanguageSelect(lang.id)}
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-12 h-12 rounded-full bg-zinc-700 items-center justify-center mr-4">
                                                <Text style={{ fontSize: 24 }}>{lang.icon}</Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white font-semibold text-base">{lang.name}</Text>
                                                <Text className="text-gray-400 text-sm mt-1">{lang.nativeName}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center">
                                            {language === lang.id ? (
                                                <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: '#FACC15' }}>
                                                    <Ionicons name="checkmark" size={16} color="white" />
                                                </View>
                                            ) : (
                                                <View className="w-6 h-6 rounded-full border-2 border-gray-600" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                    {index !== languages.length - 1 && <View className="h-px bg-zinc-700 ml-16" />}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Info */}
                    <View className="bg-zinc-800/50 rounded-2xl p-4 mb-8">
                        <View className="flex-row items-start">
                            <Ionicons name="information-circle-outline" size={20} color="#FACC15" />
                            <View className="flex-1 ml-3">
                                <Text className="text-gray-300 text-sm leading-6">
                                    {t('language.infoText')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default LanguageScreen;
