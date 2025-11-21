"use client"

import { useDietPlanningStore } from "@/hooks/useDietPlanningStore"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect } from "react"
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native"

const MealPlanningScreen = () => {
    const router = useRouter()
    const {
        selectedGoal,
        todayMeals,
        getTodayStats,
        toggleMealCompletion,
        addWater,
        removeWater,
        setTodayMeals,
    } = useDietPlanningStore()

    const stats = getTodayStats()

    // Sample meal plan for today (will be replaced by backend later)
    const sampleMeals = [
        {
            type: "Breakfast",
            name: "Protein Oatmeal Bowl",
            calories: 450,
            protein: 25,
            carbs: 60,
            fats: 12,
            time: "7:00 AM",
        },
        {
            type: "Snack",
            name: "Greek Yogurt & Berries",
            calories: 200,
            protein: 15,
            carbs: 25,
            fats: 5,
            time: "10:00 AM",
        },
        {
            type: "Lunch",
            name: "Grilled Chicken & Rice",
            calories: 650,
            protein: 45,
            carbs: 70,
            fats: 15,
            time: "1:00 PM",
        },
        {
            type: "Snack",
            name: "Protein Shake",
            calories: 300,
            protein: 30,
            carbs: 25,
            fats: 8,
            time: "4:00 PM",
        },
        {
            type: "Dinner",
            name: "Salmon & Sweet Potato",
            calories: 750,
            protein: 50,
            carbs: 65,
            fats: 25,
            time: "7:00 PM",
        },
        {
            type: "Snack",
            name: "Cottage Cheese",
            calories: 400,
            protein: 28,
            carbs: 15,
            fats: 10,
            time: "9:00 PM",
        },
    ]

    // Initialize today's meals if empty
    useEffect(() => {
        if (todayMeals.length === 0 && selectedGoal) {
            const mealsWithGoal = sampleMeals.map((m, idx) => ({
                ...m,
                id: `meal-${idx}`,
                completed: false,
            }))
            setTodayMeals(mealsWithGoal as any)
        }
    }, [selectedGoal])

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4">
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Meal Tracking</Text>
                    <View className="w-10" />
                </View>
                <Text className="text-gray-400 text-center">Track your daily nutrition</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Today's Progress Card */}
                <View className="mb-6">
                    <View className="overflow-hidden rounded-3xl">
                        <LinearGradient
                            colors={["#FACC15", "#F97316"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="p-5"
                        >
                            <Text className="text-white text-xl font-bold mb-4">Today's Progress</Text>
                            <View className="flex-row justify-between">
                                <View>
                                    <Text className="text-white/80 text-sm">Meals</Text>
                                    <Text className="text-white text-2xl font-bold">
                                        {stats.mealsCompleted}/{stats.totalMeals}
                                    </Text>
                                </View>
                                <View>
                                    <Text className="text-white/80 text-sm">Calories Left</Text>
                                    <Text className="text-white text-2xl font-bold">{stats.caloriesRemaining}</Text>
                                </View>
                                <View>
                                    <Text className="text-white/80 text-sm">Water</Text>
                                    <Text className="text-white text-2xl font-bold">
                                        {stats.waterIntake}/{stats.waterTarget}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                </View>

                {/* Water Tracker */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Water Intake</Text>
                    <View className="bg-zinc-800 rounded-3xl p-5">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 rounded-full bg-blue-900/30 items-center justify-center mr-3">
                                    <Ionicons name="water" size={24} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="text-white text-2xl font-bold">
                                        {stats.waterIntake}/{stats.waterTarget}
                                    </Text>
                                    <Text className="text-gray-400 text-sm">glasses</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            await removeWater()
                                        } catch (error) {
                                            console.error('Error removing water:', error)
                                        }
                                    }}
                                    disabled={stats.waterIntake === 0}
                                    className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-2"
                                >
                                    <Ionicons
                                        name="remove"
                                        size={20}
                                        color={stats.waterIntake === 0 ? "#52525b" : "white"}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            await addWater()
                                        } catch (error) {
                                            console.error('Error adding water:', error)
                                        }
                                    }}
                                    disabled={stats.waterIntake >= stats.waterTarget}
                                    className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
                                >
                                    <Ionicons
                                        name="add"
                                        size={20}
                                        color={stats.waterIntake >= stats.waterTarget ? "#888" : "white"}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View className="bg-zinc-700 h-2 rounded-full">
                            <View
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                    width: `${stats.waterTarget > 0 ? Math.min((stats.waterIntake / stats.waterTarget) * 100, 100) : 0}%`
                                }}
                            />
                        </View>
                    </View>
                </View>

                {/* Today's Meal Plan */}
                <View className="mb-8">
                    <Text className="text-white text-lg font-bold mb-3">Today's Meals</Text>
                    {todayMeals.length === 0 ? (
                        <View className="bg-zinc-800 rounded-3xl p-8 items-center">
                            <Ionicons name="restaurant-outline" size={48} color="#52525b" />
                            <Text className="text-gray-400 text-center mt-4 mb-2 text-base font-semibold">
                                No meals loaded yet
                            </Text>
                            <Text className="text-gray-500 text-center text-sm">
                                Your daily meal plan will appear here based on your selected goal
                            </Text>
                        </View>
                    ) : (
                        todayMeals.map((meal, index) => (
                            <View key={meal.id} className="bg-zinc-800 rounded-3xl p-5 mb-3">
                                <View className="flex-row items-center justify-between">
                                    <TouchableOpacity
                                        onPress={async () => {
                                            try {
                                                await toggleMealCompletion(meal.id)
                                            } catch (error) {
                                                console.error('Error toggling meal:', error)
                                            }
                                        }}
                                        className="flex-row items-center flex-1"
                                    >
                                        <View
                                            className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${meal.completed ? "bg-green-500 border-green-500" : "border-gray-500"
                                                }`}
                                        >
                                            {meal.completed && <Ionicons name="checkmark" size={16} color="white" />}
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1">
                                                <Text className="text-gray-400 text-xs font-semibold mr-2">
                                                    {meal.type.toUpperCase()}
                                                </Text>
                                                <Text className="text-gray-500 text-xs">{meal.time}</Text>
                                            </View>
                                            <Text
                                                className={`font-semibold mb-1 ${meal.completed ? "text-gray-500 line-through" : "text-white"
                                                    }`}
                                            >
                                                {meal.name}
                                            </Text>
                                            <View className="flex-row items-center flex-wrap">
                                                <Text className="text-gray-400 text-xs mr-3">🔥 {meal.calories} cal</Text>
                                                <Text className="text-gray-400 text-xs mr-3">💪 {meal.protein}g</Text>
                                                <Text className="text-gray-400 text-xs mr-3">🌾 {meal.carbs}g</Text>
                                                <Text className="text-gray-400 text-xs">🥑 {meal.fats}g</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Key Vitamins & Minerals */}
                {todayMeals.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-white text-lg font-bold mb-3">Key Nutrients Today</Text>
                        <View className="bg-zinc-800 rounded-3xl p-5">
                            <Text className="text-gray-400 text-xs mb-4">Based on completed meals</Text>

                            {/* Vitamins */}
                            <Text className="text-white font-semibold mb-3">Vitamins</Text>
                            {[
                                { name: "Vitamin C", amount: 85, target: 90, unit: "mg", color: "#10B981" },
                                { name: "Vitamin D", amount: 12, target: 15, unit: "μg", color: "#F97316" },
                                { name: "Vitamin B12", amount: 4.2, target: 2.4, unit: "μg", color: "#10B981" },
                            ].map((vitamin, idx) => {
                                const percentage = Math.min((vitamin.amount / vitamin.target) * 100, 100)
                                return (
                                    <View key={idx} className="mb-3">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <Text className="text-gray-300 text-sm">{vitamin.name}</Text>
                                            <Text className="text-gray-400 text-xs">
                                                {vitamin.amount}{vitamin.unit} / {vitamin.target}{vitamin.unit}
                                            </Text>
                                        </View>
                                        <View className="bg-zinc-700 h-2 rounded-full">
                                            <View
                                                className="h-2 rounded-full"
                                                style={{ width: `${percentage}%`, backgroundColor: vitamin.color }}
                                            />
                                        </View>
                                    </View>
                                )
                            })}

                            <View className="h-px bg-zinc-700 my-4" />

                            {/* Minerals */}
                            <Text className="text-white font-semibold mb-3">Minerals</Text>
                            {[
                                { name: "Calcium", amount: 950, target: 1000, unit: "mg", color: "#10B981" },
                                { name: "Iron", amount: 14, target: 18, unit: "mg", color: "#F97316" },
                                { name: "Magnesium", amount: 380, target: 420, unit: "mg", color: "#FACC15" },
                            ].map((mineral, idx) => {
                                const percentage = Math.min((mineral.amount / mineral.target) * 100, 100)
                                return (
                                    <View key={idx} className="mb-3">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <Text className="text-gray-300 text-sm">{mineral.name}</Text>
                                            <Text className="text-gray-400 text-xs">
                                                {mineral.amount}{mineral.unit} / {mineral.target}{mineral.unit}
                                            </Text>
                                        </View>
                                        <View className="bg-zinc-700 h-2 rounded-full">
                                            <View
                                                className="h-2 rounded-full"
                                                style={{ width: `${percentage}%`, backgroundColor: mineral.color }}
                                            />
                                        </View>
                                    </View>
                                )
                            })}
                        </View>
                    </View>
                )}

                {/* Quick Tips */}
                <View className="mb-8">
                    <View className="bg-zinc-800 rounded-2xl p-5">
                        <View className="flex-row items-start">
                            <View className="w-8 h-8 rounded-full bg-yellow-900/30 items-center justify-center mr-3">
                                <Ionicons name="bulb-outline" size={18} color="#FACC15" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-semibold mb-1">Track Consistently</Text>
                                <Text className="text-gray-400 text-sm">
                                    Complete meals to see your vitamin & mineral intake. Keep your streak going!
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default MealPlanningScreen
