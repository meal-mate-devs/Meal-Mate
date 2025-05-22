import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function FinishOnboarding() {
    const router = useRouter();

    useEffect(() => {
        const markOnboardingComplete = async () => {
            try {
                await AsyncStorage.setItem("onboardingComplete", "true");
            } catch (error) {
                console.log("Error saving onboarding status:", error);
            }
        };

        markOnboardingComplete();
    }, []);

    const handleContinue = () => {
        router.replace("/(auth)/login");
    };

    return (
        <View className="flex-1 bg-black justify-between items-center px-8 pt-16 pb-12">
            <StatusBar barStyle="light-content" backgroundColor="black" />

            <View className="items-center">
                <Text className="text-3xl font-bold text-yellow-400 font-poppins-bold mb-4">
                    Meal Mate
                </Text>
                <Text className="text-lg text-gray-300 text-center font-poppins mb-2">
                    Your personal guide to healthy eating
                </Text>
            </View>

            <View className="items-center w-full">
                <View className="bg-zinc-900 rounded-2xl p-8 items-center justify-center mb-8 w-full">
                    <Image
                        source={require("../../assets/images/healthyRecipe.png")}
                        className="h-64 w-64"
                        resizeMode="contain"
                    />
                </View>
                <Text className="text-2xl font-bold text-center mb-4 font-poppins-bold text-white">
                    Welcome to Meal Mate!
                </Text>
                <Text className="text-base text-center text-gray-300 mb-8 font-poppins">
                    Track your meals, discover healthy recipes, and reach your nutrition goals with personalized insights.
                </Text>
            </View>

            <TouchableOpacity
                className="bg-yellow-400 w-full py-4 rounded-xl items-center"
                onPress={handleContinue}
            >
                <Text className="text-black font-bold text-lg font-poppins-bold">
                    Let's Get Started
                </Text>
            </TouchableOpacity>
        </View>
    );
}