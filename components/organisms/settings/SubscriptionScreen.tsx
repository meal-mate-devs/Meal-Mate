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

const SubscriptionScreen: React.FC = () => {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            <View className="flex-row items-center px-4 py-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-gray-800">Subscription</Text>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Current Subscription */}
                <View className="mb-6">
                    <Text className="text-gray-500 text-sm mb-1">Your subscriptions</Text>
                    <View className="bg-gray-100 rounded-xl p-4">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-gray-800 font-medium">Pro Subscription</Text>
                            <View className="h-6 w-10 rounded-full bg-green-500 items-center justify-center">
                                <Text className="text-white text-xs font-medium">PRO</Text>
                            </View>
                        </View>

                        <View className="border-t border-gray-200 pt-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-500">valid until</Text>
                                <Text className="text-gray-800 font-medium">03/23</Text>
                            </View>

                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-500">Plan Duration</Text>
                                <Text className="text-gray-800 font-medium">3 months</Text>
                            </View>

                            <View className="flex-row justify-between">
                                <Text className="text-gray-500"># of devices</Text>
                                <Text className="text-gray-800 font-medium">2 of 3</Text>
                            </View>
                        </View>

                        {/* Plan Features */}
                        <View className="flex-row mt-4 space-x-2">
                            <View className="bg-gray-200 rounded-full flex-row items-center px-3 py-1">
                                <Feather name="check-circle" size={14} color="#2ECC71" />
                                <Text className="text-gray-700 text-xs ml-1">Cancel anytime</Text>
                            </View>

                            <View className="bg-gray-200 rounded-full flex-row items-center px-3 py-1">
                                <Feather name="repeat" size={14} color="#2ECC71" />
                                <Text className="text-gray-700 text-xs ml-1">Instantly renewable</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Buttons */}
                <TouchableOpacity className="bg-green-500 rounded-xl py-4 items-center mb-3">
                    <Text className="text-white font-bold uppercase">Upgrade subscription</Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-gray-200 rounded-xl py-4 items-center">
                    <Text className="text-gray-700 font-medium uppercase">Cancel subscription</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SubscriptionScreen;