"use client"

import { useDietPlanningStore } from "@/hooks/useDietPlanningStore"
import { DietPlan, dietPlanningService } from "@/lib/services/dietPlanningService"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useFocusEffect } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import {
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
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
        setWaterIntake,
        setTodayMeals,
    } = useDietPlanningStore()

    const [activePlan, setActivePlan] = useState<DietPlan | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [todayDate, setTodayDate] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [showCalendar, setShowCalendar] = useState(false)

    const stats = getTodayStats()

    // Helper function to check if a date is locked (in the future)
    const isDateLocked = (date: string): boolean => {
        const today = new Date().toISOString().split('T')[0]
        return date > today
    }

    // Helper function to format date label
    const getDayLabel = (date: string): string => {
        const today = new Date().toISOString().split('T')[0]
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().split('T')[0]

        if (date === today) return 'Today'
        if (date === tomorrowStr) return 'Tomorrow'

        const dateObj = new Date(date)
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
        return dateObj.toLocaleDateString('en-US', options)
    }

    // Calculate real nutrition from completed meals
    const calculateNutrition = () => {
        const completedMeals = todayMeals.filter(m => m.completed)

        if (completedMeals.length === 0 || !activePlan) {
            return { vitamins: [], minerals: [] }
        }

        // Get selected day's plan to access recipes with full nutrition data
        const dayPlan = activePlan.dailyPlans.find(dp => dp.date === selectedDate)
        if (!dayPlan) {
            return { vitamins: [], minerals: [] }
        }

        // Aggregate nutrition from completed meals
        let totalNutrition = {
            vitaminC: 0, vitaminD: 0, vitaminB12: 0,
            calcium: 0, iron: 0, magnesium: 0
        }

        completedMeals.forEach(meal => {
            const mealData = dayPlan.meals.find(m => m.mealId === meal.id)
            if (mealData?.recipe?.nutritionInfo) {
                const nutrition = mealData.recipe.nutritionInfo
                if (nutrition.vitamins) {
                    totalNutrition.vitaminC += nutrition.vitamins.vitaminC || 0
                    totalNutrition.vitaminD += nutrition.vitamins.vitaminD || 0
                    totalNutrition.vitaminB12 += nutrition.vitamins.vitaminB12 || 0
                }
                if (nutrition.minerals) {
                    totalNutrition.calcium += nutrition.minerals.calcium || 0
                    totalNutrition.iron += nutrition.minerals.iron || 0
                    totalNutrition.magnesium += nutrition.minerals.magnesium || 0
                }
            }
        })

        // Daily targets (RDA for adults)
        const vitamins = [
            { name: "Vitamin C", amount: Math.round(totalNutrition.vitaminC), target: 90, unit: "mg", color: "#10B981" },
            { name: "Vitamin D", amount: parseFloat(totalNutrition.vitaminD.toFixed(1)), target: 15, unit: "μg", color: "#F97316" },
            { name: "Vitamin B12", amount: parseFloat(totalNutrition.vitaminB12.toFixed(1)), target: 2.4, unit: "μg", color: "#10B981" },
        ]

        const minerals = [
            { name: "Calcium", amount: Math.round(totalNutrition.calcium), target: 1000, unit: "mg", color: "#10B981" },
            { name: "Iron", amount: parseFloat(totalNutrition.iron.toFixed(1)), target: 18, unit: "mg", color: "#F97316" },
            { name: "Magnesium", amount: Math.round(totalNutrition.magnesium), target: 420, unit: "mg", color: "#FACC15" },
        ]

        return { vitamins, minerals }
    }

    const nutrition = calculateNutrition()

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        setTodayDate(today)
        setSelectedDate(today)
        fetchActivePlan()
    }, [])

    // Refresh plan data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchActivePlan()
        }, [])
    )

    // Refetch data when selectedDate changes
    useEffect(() => {
        if (activePlan && selectedDate) {
            fetchActivePlan()
        }
    }, [selectedDate])

    const fetchActivePlan = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await dietPlanningService.getActivePlan()
            setActivePlan(response.plan)

            // Get selected date's meals from the plan
            const selectedPlan = response.plan.dailyPlans.find(dp => dp.date === selectedDate)
            if (selectedPlan) {
                // Convert backend meal format to store format
                const meals = selectedPlan.meals.map(meal => ({
                    id: meal.mealId,
                    name: meal.name,
                    type: meal.type,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fats: meal.fats,
                    time: meal.time,
                    completed: meal.completed,
                    hasRecipe: meal.hasRecipe,
                    recipeId: meal.recipeId,
                }))
                await setTodayMeals(meals as any)

                // Sync water intake from backend - directly set instead of incrementing
                if (selectedPlan.waterIntake !== undefined) {
                    await setWaterIntake(selectedPlan.waterIntake)
                }
            }
        } catch (error: any) {
            console.log('Error fetching active plan:', error)
            if (!error.message?.includes('No active diet plan found')) {
                setError(error.message || 'Failed to load meal plan')
            }
        } finally {
            setIsLoading(false)
        }
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
                    <Text className="text-white text-xl font-bold">Meal Tracking</Text>
                    <View className="w-10" />
                </View>
                <Text className="text-gray-400 text-center">Track your daily nutrition</Text>
            </View>

            {/* Date Navigation */}
            {activePlan && (
                <View className="px-4 pb-4 bg-black">
                    {activePlan.duration === 7 ? (
                        <>
                            <Text className="text-gray-400 text-sm mb-2">Select Day</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="flex-row" style={{ gap: 8 }}>
                                    {activePlan.dailyPlans.map((dayPlan, index) => {
                                        const isSelected = dayPlan.date === selectedDate
                                        const isLocked = isDateLocked(dayPlan.date)
                                        const label = getDayLabel(dayPlan.date)

                                        return (
                                            <TouchableOpacity
                                                key={dayPlan.date}
                                                onPress={() => setSelectedDate(dayPlan.date)}
                                                className={`px-4 py-3 rounded-xl flex-row items-center ${isSelected
                                                    ? (isLocked ? 'bg-zinc-700' : 'bg-yellow-500')
                                                    : (isLocked ? 'bg-zinc-900' : 'bg-zinc-800')
                                                    }`}
                                            >
                                                {isLocked && (
                                                    <Ionicons
                                                        name="lock-closed"
                                                        size={14}
                                                        color="#52525b"
                                                        style={{ marginRight: 6 }}
                                                    />
                                                )}
                                                <Text
                                                    className={`font-medium ${isLocked ? 'text-gray-500' : (isSelected ? 'text-black' : 'text-white')
                                                        }`}
                                                >
                                                    {label}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </ScrollView>
                        </>
                    ) : (
                        <>
                            <Text className="text-gray-400 text-sm mb-2">Select Date</Text>
                            <TouchableOpacity
                                onPress={() => setShowCalendar(true)}
                                className="bg-zinc-800 rounded-xl p-4 flex-row items-center justify-between"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar" size={20} color="#FACC15" style={{ marginRight: 8 }} />
                                    <Text className="text-white font-medium">{getDayLabel(selectedDate)}</Text>
                                    {isDateLocked(selectedDate) && (
                                        <View className="ml-2 px-2 py-1 bg-zinc-700 rounded-lg flex-row items-center">
                                            <Ionicons name="lock-closed" size={12} color="gray" style={{ marginRight: 4 }} />
                                            <Text className="text-gray-400 text-xs">Locked</Text>
                                        </View>
                                    )}
                                </View>
                                <Ionicons name="chevron-down" size={20} color="gray" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Lock Overlay for Future Dates */}
                {isDateLocked(selectedDate) && (
                    <View className="mb-4">
                        <View className="bg-yellow-900/20 border border-yellow-500/30 rounded-3xl p-5">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-full bg-yellow-500/20 items-center justify-center mr-3">
                                    <Ionicons name="lock-closed" size={20} color="#FACC15" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-yellow-400 font-bold mb-1">Date Locked</Text>
                                    <Text className="text-yellow-400/80 text-sm">
                                        This day's plan will be available on {getDayLabel(selectedDate)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Today's Progress Card */}
                <View className="mb-6">
                    {isLoading ? (
                        <View className="overflow-hidden rounded-3xl bg-zinc-800">
                            <View className="p-5">
                                <View className="w-40 h-6 bg-zinc-700 rounded mb-4" />
                                <View className="flex-row justify-between">
                                    <View>
                                        <View className="w-16 h-4 bg-zinc-700 rounded mb-2" />
                                        <View className="w-12 h-8 bg-zinc-700 rounded" />
                                    </View>
                                    <View>
                                        <View className="w-20 h-4 bg-zinc-700 rounded mb-2" />
                                        <View className="w-16 h-8 bg-zinc-700 rounded" />
                                    </View>
                                    <View>
                                        <View className="w-16 h-4 bg-zinc-700 rounded mb-2" />
                                        <View className="w-12 h-8 bg-zinc-700 rounded" />
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
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
                                            {stats.waterIntake}/{activePlan?.dailyWaterTarget || stats.waterTarget}
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>
                    )}
                </View>

                {/* Water Tracker */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Water Intake</Text>
                    {isLoading ? (
                        <View className="bg-zinc-800 rounded-3xl p-5">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 rounded-full bg-zinc-700 mr-3" />
                                    <View>
                                        <View className="w-20 h-8 bg-zinc-700 rounded mb-2" />
                                        <View className="w-16 h-4 bg-zinc-700 rounded" />
                                    </View>
                                </View>
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-zinc-700 mr-2" />
                                    <View className="w-10 h-10 rounded-full bg-zinc-700" />
                                </View>
                            </View>
                            <View className="bg-zinc-700 h-2 rounded-full" />
                        </View>
                    ) : (
                        <View className="bg-zinc-800 rounded-3xl p-5">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 rounded-full bg-blue-900/30 items-center justify-center mr-3">
                                        <Ionicons name="water" size={24} color="#3B82F6" />
                                    </View>
                                    <View>
                                        <Text className="text-white text-2xl font-bold">
                                            {stats.waterIntake}/{activePlan?.dailyWaterTarget || stats.waterTarget}
                                        </Text>
                                        <Text className="text-gray-400 text-sm">glasses</Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center">
                                    <TouchableOpacity
                                        onPress={async () => {
                                            try {
                                                await removeWater()
                                                // Sync with backend
                                                if (activePlan) {
                                                    await dietPlanningService.updateWaterIntake({
                                                        planId: activePlan.planId,
                                                        date: selectedDate,
                                                        waterIntake: stats.waterIntake - 1
                                                    })
                                                }
                                            } catch (error) {
                                                console.log('Error removing water:', error)
                                            }
                                        }}
                                        disabled={stats.waterIntake === 0 || isDateLocked(selectedDate)}
                                        className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-2"
                                    >
                                        <Ionicons
                                            name="remove"
                                            size={20}
                                            color={stats.waterIntake === 0 || isDateLocked(selectedDate) ? "#52525b" : "white"}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            try {
                                                await addWater()
                                                // Sync with backend
                                                if (activePlan) {
                                                    await dietPlanningService.updateWaterIntake({
                                                        planId: activePlan.planId,
                                                        date: selectedDate,
                                                        waterIntake: stats.waterIntake + 1
                                                    })
                                                }
                                            } catch (error) {
                                                console.log('Error adding water:', error)
                                            }
                                        }}
                                        disabled={stats.waterIntake >= (activePlan?.dailyWaterTarget || stats.waterTarget) || isDateLocked(selectedDate)}
                                        className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
                                    >
                                        <Ionicons
                                            name="add"
                                            size={20}
                                            color={stats.waterIntake >= (activePlan?.dailyWaterTarget || stats.waterTarget) || isDateLocked(selectedDate) ? "#888" : "white"}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View className="bg-zinc-700 h-2 rounded-full">
                                <View
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{
                                        width: `${(activePlan?.dailyWaterTarget || stats.waterTarget) > 0 ? Math.min((stats.waterIntake / (activePlan?.dailyWaterTarget || stats.waterTarget)) * 100, 100) : 0}%`
                                    }}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Today's Meal Plan */}
                <View className="mb-8">
                    <Text className="text-white text-lg font-bold mb-3">Today's Meals</Text>

                    {/* Loading State - Skeleton Loader */}
                    {isLoading && (
                        <>
                            {[1, 2, 3, 4].map((index) => (
                                <View key={index} className="bg-zinc-800 rounded-3xl p-5 mb-3">
                                    {/* Meal header skeleton */}
                                    <View className="flex-row items-start justify-between mb-3">
                                        <View className="flex-row items-center flex-1">
                                            {/* Checkbox skeleton */}
                                            <View className="w-6 h-6 rounded-full bg-zinc-700 mr-3" />
                                            <View className="flex-1">
                                                {/* Meal type skeleton */}
                                                <View className="w-20 h-3 bg-zinc-700 rounded mb-2" />
                                                {/* Meal name skeleton */}
                                                <View className="w-40 h-4 bg-zinc-700 rounded mb-2" />
                                                {/* Nutrition info skeleton */}
                                                <View className="flex-row items-center flex-wrap">
                                                    <View className="w-16 h-3 bg-zinc-700 rounded mr-3" />
                                                    <View className="w-16 h-3 bg-zinc-700 rounded mr-3" />
                                                    <View className="w-16 h-3 bg-zinc-700 rounded mr-3" />
                                                    <View className="w-16 h-3 bg-zinc-700 rounded" />
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    {/* Button skeleton */}
                                    <View className="w-full h-12 bg-zinc-700 rounded-xl" />
                                </View>
                            ))}
                        </>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <View className="bg-red-900/20 border border-red-500/30 rounded-3xl p-5">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                                <Text className="text-red-400 font-bold ml-2">Error</Text>
                            </View>
                            <Text className="text-red-300 text-sm mb-3">{error}</Text>
                            <TouchableOpacity
                                onPress={fetchActivePlan}
                                className="bg-red-500/20 rounded-xl py-2 px-4 self-start"
                            >
                                <Text className="text-red-400 font-semibold">Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* No Meals State */}
                    {!isLoading && !error && todayMeals.length === 0 && (
                        <View className="bg-zinc-800 rounded-3xl p-8 items-center">
                            <Ionicons name="restaurant-outline" size={48} color="#52525b" />
                            <Text className="text-gray-400 text-center mt-4 mb-2 text-base font-semibold">
                                No meal plan for today
                            </Text>
                            <Text className="text-gray-500 text-center text-sm mb-4">
                                Create an AI meal plan to get started
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/diet-plan/ai-meal-plan" as any)}
                                className="overflow-hidden rounded-xl"
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={["#8B5CF6", "#6366F1"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-3 px-6"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="sparkles" size={18} color="white" />
                                        <Text className="text-white font-semibold ml-2">Generate Plan</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Meals List */}
                    {!isLoading && !error && todayMeals.length > 0 && (
                        todayMeals.map((meal, index) => (
                            <View key={meal.id} className="bg-zinc-800 rounded-3xl p-5 mb-3">{/* rest of meal card */}
                                <View className="flex-row items-start justify-between mb-3">
                                    <TouchableOpacity
                                        onPress={async () => {
                                            try {
                                                // Update local state immediately for instant UI feedback
                                                await toggleMealCompletion(meal.id)

                                                // Sync with backend
                                                if (activePlan) {
                                                    const isNowCompleted = !meal.completed
                                                    await dietPlanningService.updateMealStatus({
                                                        planId: activePlan.planId,
                                                        date: selectedDate,
                                                        mealId: meal.id,
                                                        completed: isNowCompleted
                                                    })

                                                    // Refetch plan to get updated nutrition data
                                                    await fetchActivePlan()
                                                }
                                            } catch (error) {
                                                console.log('Error toggling meal:', error)
                                            }
                                        }}
                                        disabled={isDateLocked(selectedDate)}
                                        className="flex-row items-center flex-1"
                                    >
                                        <View
                                            className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${meal.completed ? "bg-green-500 border-green-500" :
                                                isDateLocked(selectedDate) ? "border-gray-600" : "border-gray-500"
                                                }`}
                                        >
                                            {meal.completed && <Ionicons name="checkmark" size={16} color="white" />}
                                            {isDateLocked(selectedDate) && !meal.completed && (
                                                <Ionicons name="lock-closed" size={12} color="#71717a" />
                                            )}
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

                                {/* View Recipe Button */}
                                {activePlan && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!isDateLocked(selectedDate)) {
                                                console.log(`🍽️ View Recipe - Meal: ${meal.name}, MealID: ${meal.id}, PlanID: ${activePlan.planId}, Date: ${selectedDate}`)
                                                router.push({
                                                    pathname: "/diet-plan/view-recipe" as any,
                                                    params: {
                                                        planId: activePlan.planId,
                                                        date: selectedDate,
                                                        mealId: meal.id,
                                                    }
                                                })
                                            }
                                        }}
                                        disabled={isDateLocked(selectedDate)}
                                        className="overflow-hidden rounded-xl"
                                        activeOpacity={isDateLocked(selectedDate) ? 1 : 0.8}
                                    >
                                        <LinearGradient
                                            colors={["#FACC15", "#F97316"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            className="py-3 px-4"
                                            style={{ opacity: isDateLocked(selectedDate) ? 0.3 : 1 }}
                                        >
                                            <View className="flex-row items-center justify-center">
                                                <Ionicons
                                                    name="book-outline"
                                                    size={18}
                                                    color="white"
                                                />
                                                <Text className="text-white text-center font-bold ml-2">
                                                    View Recipe
                                                </Text>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
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
                            {nutrition.vitamins.length > 0 ? (
                                nutrition.vitamins.map((vitamin, idx) => {
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
                                })
                            ) : (
                                <Text className="text-gray-500 text-sm">Complete meals to see vitamin intake</Text>
                            )}

                            <View className="h-px bg-zinc-700 my-4" />

                            {/* Minerals */}
                            <Text className="text-white font-semibold mb-3">Minerals</Text>
                            {nutrition.minerals.length > 0 ? (
                                nutrition.minerals.map((mineral, idx) => {
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
                                })
                            ) : (
                                <Text className="text-gray-500 text-sm">Complete meals to see mineral intake</Text>
                            )}
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

            {/* Calendar Modal for Monthly Plans */}
            {activePlan && activePlan.duration !== 7 && showCalendar && (
                <Modal
                    visible={showCalendar}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowCalendar(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setShowCalendar(false)}
                        className="flex-1 bg-black/50 justify-center items-center"
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            className="bg-zinc-900 rounded-3xl p-6 mx-4 w-11/12"
                        >
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-white text-lg font-bold">Select Date</Text>
                                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <DateTimePicker
                                value={new Date(selectedDate)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                                onChange={(event, date) => {
                                    if (event.type === 'set' && date) {
                                        const dateStr = date.toISOString().split('T')[0]

                                        // Check if date is within plan range
                                        const isInPlan = activePlan.dailyPlans.some(dp => dp.date === dateStr)

                                        if (isInPlan) {
                                            setSelectedDate(dateStr)
                                            setShowCalendar(false)
                                        }
                                    } else if (event.type === 'dismissed') {
                                        setShowCalendar(false)
                                    }
                                }}
                                minimumDate={new Date(activePlan.startDate)}
                                maximumDate={new Date(activePlan.endDate)}
                                textColor="white"
                                themeVariant="dark"
                            />

                            <View className="mt-4 p-3 bg-zinc-800 rounded-xl">
                                <View className="flex-row items-center">
                                    <Ionicons name="information-circle" size={20} color="#FACC15" />
                                    <Text className="text-gray-400 text-sm ml-2">
                                        Future dates are locked until they arrive
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}
        </SafeAreaView>
    )
}

export default MealPlanningScreen
