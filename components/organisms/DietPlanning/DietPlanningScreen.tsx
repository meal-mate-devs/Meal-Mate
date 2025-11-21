"use client"

import { useDietPlanningStore } from "@/hooks/useDietPlanningStore"
import { DIET_GOALS } from "@/lib/constants/dietPlanning"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React from "react"
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

const DietPlanningScreen = () => {
    const router = useRouter()
    const {
        selectedGoal,
        streakData,
        getTodayStats,
        setGoal,
    } = useDietPlanningStore()

    // Get today's statistics
    const stats = getTodayStats()

    // Get current goal details
    const currentGoal = DIET_GOALS.find(g => g.id === selectedGoal)

    // Calculate meal completion percentage safely
    const mealCompletionPercentage = stats.totalMeals > 0
        ? Math.round((stats.mealsCompleted / stats.totalMeals) * 100)
        : 0

    // Quick stats
    const quickStats = [
        {
            label: "Today's Meals",
            value: `${stats.mealsCompleted}/${stats.totalMeals}`,
            icon: "restaurant-outline",
            color: "#10B981",
        },
        {
            label: "Calories Left",
            value: stats.caloriesRemaining.toString(),
            icon: "flame-outline",
            color: "#F97316",
        },
        {
            label: "Water Intake",
            value: `${stats.waterIntake}/${stats.waterTarget}`,
            icon: "water-outline",
            color: "#3B82F6",
        },
        {
            label: "Streak Days",
            value: streakData.currentStreak.toString(),
            icon: "trophy-outline",
            color: "#FACC15",
        },
    ]

    const handleGoalChange = async (goalId: string) => {
        await setGoal(goalId as any)
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4">
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Diet Planning</Text>
                    <TouchableOpacity>
                        <Ionicons name="settings-outline" size={24} color="#FACC15" />
                    </TouchableOpacity>
                </View>
                <Text className="text-gray-400 text-center">Personalized nutrition for healthy living</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>


                {/* Active Meal Plan */}
                <View className="mb-6">
                    <Text className="text-white text-xl font-bold mb-4">Active Meal Plan</Text>
                    <View className="overflow-hidden rounded-3xl">
                        <LinearGradient
                            colors={["#10B981", "#059669"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="p-5"
                        >
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-2">
                                        <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                                            <Text className="text-white text-xs font-bold">ACTIVE GOAL</Text>
                                        </View>
                                    </View>
                                    <Text className="text-white text-xl font-bold mb-1">
                                        {currentGoal?.name || 'Muscle Gain'}
                                    </Text>
                                    <Text className="text-white/80 text-sm">
                                        {stats.caloriesTarget.toLocaleString()} cal/day target
                                    </Text>
                                </View>
                                <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center">
                                    <Text className="text-3xl">{currentGoal?.icon || '💪'}</Text>
                                </View>
                            </View>
                            <View className="h-px bg-white/20 my-3" />
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-white/70 text-xs">Today's Progress</Text>
                                    <Text className="text-white text-lg font-bold">{stats.mealsCompleted} of {stats.totalMeals} meals</Text>
                                </View>
                                <View className="bg-white/20 h-2 rounded-full flex-1 mx-4">
                                    <View
                                        className="bg-white h-2 rounded-full"
                                        style={{ width: `${mealCompletionPercentage}%` }}
                                    />
                                </View>
                                <Text className="text-white/90 text-sm font-semibold">
                                    {mealCompletionPercentage}%
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                </View>


                {/* Today's Overview (Quick Stats - 4 Cards) */}
                <View className="mb-6">
                    <Text className="text-white text-xl font-bold mb-4">Today's Overview</Text>
                    <View className="flex-row flex-wrap justify-between">
                        {quickStats.map((stat, index) => (
                            <View key={index} className="w-[48%] bg-zinc-800 rounded-2xl p-4 mb-3">
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center mb-3"
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                                </View>
                                <Text className="text-gray-400 text-xs mb-1">{stat.label}</Text>
                                <Text className="text-white text-2xl font-bold">{stat.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                {/* Overall Nutrition Breakdown */}
                <View className="mb-6">
                    <Text className="text-white text-xl font-bold mb-4">Overall Nutrition Status</Text>
                    <View className="bg-zinc-800 rounded-3xl p-5">
                        <Text className="text-gray-400 text-sm mb-4">Weekly Average</Text>

                        {/* Macros */}
                        <View className="mb-4">
                            <Text className="text-white font-semibold mb-3">Macronutrients</Text>
                            {[
                                { name: "Protein", current: 142, target: 140, unit: "g", color: "#10B981" },
                                { name: "Carbs", current: 268, target: 280, unit: "g", color: "#3B82F6" },
                                { name: "Fats", current: 78, target: 85, unit: "g", color: "#F97316" },
                            ].map((macro, idx) => {
                                const percentage = Math.min((macro.current / macro.target) * 100, 100)
                                return (
                                    <View key={idx} className="mb-3">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <Text className="text-gray-300 text-sm">{macro.name}</Text>
                                            <Text className="text-gray-400 text-xs">
                                                {macro.current}{macro.unit} / {macro.target}{macro.unit}
                                            </Text>
                                        </View>
                                        <View className="bg-zinc-700 h-2 rounded-full">
                                            <View
                                                className="h-2 rounded-full"
                                                style={{ width: `${percentage}%`, backgroundColor: macro.color }}
                                            />
                                        </View>
                                    </View>
                                )
                            })}
                        </View>

                        <View className="h-px bg-zinc-700 my-4" />

                        {/* Key Micronutrients */}
                        <View>
                            <Text className="text-white font-semibold mb-3">Key Micronutrients</Text>
                            {[
                                { name: "Vitamin D", status: 78, color: "#F97316" },
                                { name: "Calcium", status: 92, color: "#10B981" },
                                { name: "Iron", status: 85, color: "#FACC15" },
                                { name: "Vitamin C", status: 95, color: "#10B981" },
                            ].map((nutrient, idx) => (
                                <View key={idx} className="flex-row items-center justify-between mb-3">
                                    <Text className="text-gray-300 text-sm flex-1">{nutrient.name}</Text>
                                    <View className="flex-row items-center">
                                        <View className="bg-zinc-700 h-2 rounded-full w-20 mr-2">
                                            <View
                                                className="h-2 rounded-full"
                                                style={{ width: `${nutrient.status}%`, backgroundColor: nutrient.color }}
                                            />
                                        </View>
                                        <Text className="text-gray-400 text-xs w-10">{nutrient.status}%</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Main Features */}
                <View className="mb-6">
                    <Text className="text-white text-xl font-bold mb-4">Features</Text>

                    {/* Meal Planning */}
                    <TouchableOpacity
                        onPress={() => router.push("/diet-plan/meal-planning" as any)}
                        className="mb-4"
                        activeOpacity={0.8}
                    >
                        <View className="overflow-hidden rounded-3xl">
                            <LinearGradient
                                colors={["#FACC15", "#F97316"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="p-5"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
                                            <Ionicons name="calendar-outline" size={28} color="white" />
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1">
                                                <Text className="text-white text-lg font-bold mr-2">Meal Tracking</Text>
                                                <View className="bg-white/30 px-2 py-1 rounded-full">
                                                    <Text className="text-white text-xs font-bold">Track</Text>
                                                </View>
                                            </View>
                                            <Text className="text-white/80 text-sm">
                                                Meals, water, vitamins & nutrients
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="white" />
                                </View>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>

                    {/* AI Meal Plan Generator */}
                    <TouchableOpacity
                        onPress={() => router.push("/diet-plan/ai-meal-plan" as any)}
                        className="mb-4"
                        activeOpacity={0.8}
                    >
                        <View className="overflow-hidden rounded-3xl">
                            <LinearGradient
                                colors={["#8B5CF6", "#6366F1"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="p-5"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
                                            <Ionicons name="sparkles-outline" size={28} color="white" />
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1">
                                                <Text className="text-white text-lg font-bold mr-2">AI Meal Plans</Text>
                                                <View className="bg-white/30 px-2 py-1 rounded-full">
                                                    <Text className="text-white text-xs font-bold">AI</Text>
                                                </View>
                                            </View>
                                            <Text className="text-white/80 text-sm">
                                                Generate custom weekly & monthly plans
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="white" />
                                </View>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>

                    {/* Health Conditions */}
                    <TouchableOpacity
                        onPress={() => router.push("/diet-plan/health-conditions" as any)}
                        activeOpacity={0.8}
                    >
                        <View className="overflow-hidden rounded-3xl">
                            <LinearGradient
                                colors={["#10B981", "#059669"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="p-5"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
                                            <Ionicons name="medical-outline" size={28} color="white" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white text-lg font-bold mb-1">Health Conditions</Text>
                                            <Text className="text-white/80 text-sm">Specialized dietary plans</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="white" />
                                </View>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Nutrition Tips Section */}
                <View className="mb-8">
                    <Text className="text-white text-xl font-bold mb-4">Quick Tips</Text>
                    <View className="bg-zinc-800 rounded-2xl p-5">
                        <View className="flex-row items-start mb-3">
                            <View className="w-8 h-8 rounded-full bg-green-900/30 items-center justify-center mr-3">
                                <Ionicons name="bulb-outline" size={18} color="#10B981" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-semibold mb-1">Stay Consistent</Text>
                                <Text className="text-gray-400 text-sm">
                                    Track your meals daily to build healthy habits and reach your goals faster.
                                </Text>
                            </View>
                        </View>
                        <View className="h-px bg-zinc-700 my-3" />
                        <View className="flex-row items-start">
                            <View className="w-8 h-8 rounded-full bg-blue-900/30 items-center justify-center mr-3">
                                <Ionicons name="water-outline" size={18} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-semibold mb-1">Stay Hydrated</Text>
                                <Text className="text-gray-400 text-sm">
                                    Drink water throughout the day. Track your intake to ensure proper hydration.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default DietPlanningScreen
