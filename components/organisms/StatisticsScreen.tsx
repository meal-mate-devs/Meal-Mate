import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const StatisticsScreen = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Week');
    const tabs = ['Day', 'Week', 'Month'];

    // Sample data for the chart
    const weekData = [
        { day: 'Sun', calories: 150 },
        { day: 'Mon', calories: 180 },
        { day: 'Tue', calories: 160 },
        { day: 'Wed', calories: 210 },
        { day: 'Thu', calories: 190 },
        { day: 'Fri', calories: 170 },
        { day: 'Sat', calories: 140 },
    ];

    const goals = [
        {
            id: '1',
            name: 'Avoid to eat fast food',
            icon: '🍔',
            progress: 70,
            completed: false
        },
        {
            id: '2',
            name: 'Reduce sugar level',
            icon: '🍦',
            progress: 100,
            completed: true
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-800">Statistics</Text>
                <TouchableOpacity>
                    <Feather name="more-horizontal" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Calories Section */}
                <View className="mb-6">
                    <Text className="text-xl font-bold text-gray-800 mb-4">Calories</Text>

                    {/* Tabs */}
                    <View className="flex-row mb-6">
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className={`mr-6 pb-1 ${activeTab === tab ? 'border-b-2 border-green-500' : ''}`}
                            >
                                <Text
                                    className={`${activeTab === tab ? 'text-green-500 font-medium' : 'text-gray-400'
                                        }`}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Chart */}
                    <View className="mb-4 bg-gray-50 p-4 rounded-xl">
                        {/* Current day highlight */}
                        <View className="bg-green-100 self-end rounded-lg p-2 mb-2">
                            <Text className="text-green-800 font-medium">Wednesday</Text>
                            <Text className="text-green-800 font-bold">184 kcal</Text>
                        </View>

                        {/* Chart container - in a real app, use a proper chart library */}
                        <View className="h-40 w-full">
                            {/* This is a placeholder for the actual chart */}
                            <View className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
                            <View className="absolute left-0 bottom-0 top-0 w-px bg-gray-200" />

                            {/* Y-axis labels */}
                            <View className="absolute left-0 h-full justify-between py-1">
                                <Text className="text-xs text-gray-400">250</Text>
                                <Text className="text-xs text-gray-400">200</Text>
                                <Text className="text-xs text-gray-400">150</Text>
                                <Text className="text-xs text-gray-400">100</Text>
                                <Text className="text-xs text-gray-400">50</Text>
                            </View>

                            {/* Simplified chart line */}
                            <View className="absolute left-12 right-0 bottom-10 h-20">
                                <View className="absolute bottom-0 left-0 right-0 h-16 rounded-full overflow-hidden">
                                    <View className="absolute left-0 right-0 bottom-0 h-8 bg-green-100 opacity-30" />
                                </View>
                                <View className="absolute bottom-0 left-0 right-0 h-20 flex-row items-end">
                                    <View className="flex-1 h-10 border-t-2 border-green-500" style={{ borderTopLeftRadius: 20 }} />
                                    <View className="flex-1 h-16 border-t-2 border-green-500" />
                                    <View className="flex-1 h-12 border-t-2 border-green-500" />
                                    <View className="flex-1 h-16 border-t-2 border-green-500" />
                                    <View className="flex-1 h-14 border-t-2 border-green-500" />
                                    <View className="flex-1 h-10 border-t-2 border-green-500" />
                                    <View className="flex-1 h-8 border-t-2 border-green-500" style={{ borderTopRightRadius: 20 }} />
                                </View>
                            </View>

                            {/* X-axis labels */}
                            <View className="absolute bottom-0 left-12 right-0 flex-row justify-between">
                                {weekData.map((item, index) => (
                                    <Text
                                        key={index}
                                        className={`text-xs ${item.day === 'Wed' ? 'text-green-500 font-medium' : 'text-gray-400'}`}
                                    >
                                        {item.day}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Progress Section */}
                <View className="mb-6">
                    <Text className="text-xl font-bold text-gray-800 mb-4">Progress</Text>

                    {/* Progress Items */}
                    {goals.map((goal) => (
                        <View
                            key={goal.id}
                            className="flex-row items-center justify-between py-4 border-b border-gray-100"
                        >
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-4">{goal.icon}</Text>
                                <Text className="text-gray-800 text-base">{goal.name}</Text>
                            </View>

                            {goal.completed ? (
                                <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                                    <Feather name="check" size={16} color="#2E7D66" />
                                </View>
                            ) : (
                                <View className="w-10 h-10 rounded-full items-center justify-center">
                                    {/* Progress circle */}
                                    <View className="absolute w-10 h-10 rounded-full border-2 border-gray-200" />
                                    <View
                                        className="absolute top-0 right-0 w-10 h-10 rounded-full border-2 border-green-500"
                                        style={{
                                            borderTopColor: '#2E7D66',
                                            borderRightColor: '#2E7D66',
                                            borderBottomColor: 'transparent',
                                            borderLeftColor: 'transparent',
                                            transform: [{ rotate: `${goal.progress * 3.6}deg` }]
                                        }}
                                    />
                                    <Text className="text-xs text-green-700 font-bold">{goal.progress}%</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default StatisticsScreen;