"use client"

import Dialog from "@/components/atoms/Dialog"
import { useDietPlanningStore } from "@/hooks/useDietPlanningStore"
import { DIET_GOALS } from "@/lib/constants/dietPlanning"
import { DietPlan, dietPlanningService } from "@/lib/services/dietPlanningService"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

const DietPlanningScreen = () => {
    const router = useRouter()
    const {
        selectedGoal,
        streakData,
        getTodayStats,
        setGoal,
        setWaterIntake,
        setTodayMeals,
    } = useDietPlanningStore()

    const [activePlan, setActivePlan] = useState<DietPlan | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDeletingPlan, setIsDeletingPlan] = useState(false)

    // Dialog states
    const [showDialog, setShowDialog] = useState(false)
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'confirm'>('confirm')
    const [dialogTitle, setDialogTitle] = useState('')
    const [dialogMessage, setDialogMessage] = useState('')
    const [dialogAction, setDialogAction] = useState<(() => void) | null>(null)

    // Fetch active plan from backend
    useEffect(() => {
        fetchActivePlan()
    }, [])

    // Refresh data when screen comes into focus (after generating new plan)
    useFocusEffect(
        React.useCallback(() => {
            fetchActivePlan()
        }, [])
    )

    const fetchActivePlan = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await dietPlanningService.getActivePlan()
            setActivePlan(response.plan)

            // Sync today's data from backend
            const todayPlan = dietPlanningService.getTodayPlan(response.plan)
            if (todayPlan) {
                // Sync water intake
                if (todayPlan.waterIntake !== undefined) {
                    await setWaterIntake(todayPlan.waterIntake)
                }

                // Sync meals
                const meals = todayPlan.meals.map(meal => ({
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
            }

            console.log('✅ Active plan loaded:', response.plan.dailyPlans[0])
        } catch (error: any) {
            if (error.message?.includes('No active diet plan found')) {
                // No plan exists - this is expected for new users
                setActivePlan(null)
            } else {
                console.log('Error fetching active plan:', error)
                setError(error.message || 'Failed to load diet plan')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeletePlan = async () => {
        if (!activePlan) return

        // Show confirmation dialog
        setDialogType('confirm')
        setDialogTitle('Cancel Meal Plan')
        setDialogMessage('Are you sure you want to cancel your current meal plan? This action cannot be undone.')
        setDialogAction(() => async () => {
            try {
                setIsDeletingPlan(true)
                await dietPlanningService.deletePlan(activePlan.planId)

                // Refresh the plan data
                await fetchActivePlan()

                // Show success dialog
                setDialogType('success')
                setDialogTitle('Plan Cancelled')
                setDialogMessage('Your meal plan has been cancelled successfully')
                setDialogAction(null)
                setShowDialog(true)
            } catch (error: any) {
                console.log('Error deleting plan:', error)
                setDialogType('error')
                setDialogTitle('Error')
                setDialogMessage(error.message || 'Failed to cancel plan')
                setDialogAction(null)
                setShowDialog(true)
            } finally {
                setIsDeletingPlan(false)
            }
        })
        setShowDialog(true)
    }

    // Get today's statistics
    const stats = getTodayStats()

    // Get current goal details
    const currentGoal = DIET_GOALS.find(g => g.id === selectedGoal)

    // Calculate overall nutrition from active plan
    const calculateOverallNutrition = () => {
        if (!activePlan) {
            return { macros: [], micronutrients: [] }
        }

        // Aggregate nutrition from all completed meals across all days
        let totalNutrition = {
            protein: 0, carbs: 0, fats: 0,
            vitaminC: 0, vitaminD: 0, calcium: 0, iron: 0
        }
        let completedMealsCount = 0

        activePlan.dailyPlans.forEach(day => {
            day.meals.forEach(meal => {
                if (meal.completed) {
                    completedMealsCount++
                    totalNutrition.protein += meal.protein
                    totalNutrition.carbs += meal.carbs
                    totalNutrition.fats += meal.fats

                    // Add vitamins/minerals from recipe if available
                    if (meal.recipe?.nutritionInfo) {
                        const nutrition = meal.recipe.nutritionInfo
                        if (nutrition.vitamins) {
                            totalNutrition.vitaminC += nutrition.vitamins.vitaminC || 0
                            totalNutrition.vitaminD += nutrition.vitamins.vitaminD || 0
                        }
                        if (nutrition.minerals) {
                            totalNutrition.calcium += nutrition.minerals.calcium || 0
                            totalNutrition.iron += nutrition.minerals.iron || 0
                        }
                    }
                }
            })
        })

        // Calculate averages (daily averages based on completed days)
        const completedDays = Math.max(1, Math.ceil(completedMealsCount / 3)) // Assume ~3 meals per day
        const avgProtein = Math.round(totalNutrition.protein / completedDays)
        const avgCarbs = Math.round(totalNutrition.carbs / completedDays)
        const avgFats = Math.round(totalNutrition.fats / completedDays)
        const avgVitaminC = Math.round(totalNutrition.vitaminC / completedDays)
        const avgVitaminD = parseFloat((totalNutrition.vitaminD / completedDays).toFixed(1))
        const avgCalcium = Math.round(totalNutrition.calcium / completedDays)
        const avgIron = parseFloat((totalNutrition.iron / completedDays).toFixed(1))

        // Targets from plan
        const proteinTarget = activePlan.macroTargets.protein
        const carbsTarget = activePlan.macroTargets.carbs
        const fatsTarget = activePlan.macroTargets.fats

        const macros = [
            { name: "Protein", current: avgProtein, target: proteinTarget, unit: "g", color: "#10B981" },
            { name: "Carbs", current: avgCarbs, target: carbsTarget, unit: "g", color: "#3B82F6" },
            { name: "Fats", current: avgFats, target: fatsTarget, unit: "g", color: "#F97316" },
        ]

        // Micronutrient daily targets (RDA)
        const micronutrients = [
            { name: "Vitamin D", current: avgVitaminD, target: 15, status: Math.min(Math.round((avgVitaminD / 15) * 100), 100), color: "#F97316" },
            { name: "Calcium", current: avgCalcium, target: 1000, status: Math.min(Math.round((avgCalcium / 1000) * 100), 100), color: "#10B981" },
            { name: "Iron", current: avgIron, target: 18, status: Math.min(Math.round((avgIron / 18) * 100), 100), color: "#FACC15" },
            { name: "Vitamin C", current: avgVitaminC, target: 90, status: Math.min(Math.round((avgVitaminC / 90) * 100), 100), color: "#10B981" },
        ]

        return { macros, micronutrients, hasData: true } // Always show, even with 0 completed meals
    }

    const overallNutrition = calculateOverallNutrition()

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
            value: `${stats.waterIntake}/${activePlan?.dailyWaterTarget || stats.waterTarget}`,
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
                <View className="flex-row items-center justify-center mb-2 relative">
                    <TouchableOpacity onPress={() => router.back()} className="absolute left-0 p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Diet Planning</Text>
                </View>
                <Text className="text-gray-400 text-center">Personalize nutrition for healthy living</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>

                {/* Loading State - Skeleton Loader */}
                {isLoading && (
                    <>
                        {/* Active Plan Skeleton */}
                        <View className="mb-6">
                            <View className="w-40 h-7 bg-zinc-800 rounded mb-4" />
                            <View className="bg-zinc-800 rounded-3xl p-5">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2">
                                            <View className="w-16 h-6 bg-zinc-700 rounded-full mr-2" />
                                            <View className="w-20 h-6 bg-zinc-700 rounded-full" />
                                        </View>
                                        <View className="w-48 h-6 bg-zinc-700 rounded mb-2" />
                                        <View className="w-40 h-4 bg-zinc-700 rounded" />
                                    </View>
                                    <View className="w-14 h-14 bg-zinc-700 rounded-full" />
                                </View>
                                <View className="h-px bg-zinc-700 my-3" />
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <View className="w-20 h-3 bg-zinc-700 rounded mb-2" />
                                        <View className="w-24 h-5 bg-zinc-700 rounded" />
                                    </View>
                                    <View className="bg-zinc-700 h-2 rounded-full flex-1 mx-4" />
                                    <View className="w-12 h-4 bg-zinc-700 rounded" />
                                </View>
                            </View>
                        </View>

                        {/* Today's Overview Skeleton */}
                        <View className="mb-6">
                            <View className="w-40 h-7 bg-zinc-800 rounded mb-4" />
                            <View className="flex-row flex-wrap justify-between">
                                {[1, 2, 3, 4].map((i) => (
                                    <View key={i} className="bg-zinc-800 rounded-2xl p-4 mb-3" style={{ width: '48%' }}>
                                        <View className="flex-row items-center justify-between mb-3">
                                            <View className="w-10 h-10 bg-zinc-700 rounded-full" />
                                            <View className="w-12 h-5 bg-zinc-700 rounded" />
                                        </View>
                                        <View className="w-20 h-4 bg-zinc-700 rounded" />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Quick Actions Skeleton */}
                        <View className="mb-6">
                            <View className="w-32 h-7 bg-zinc-800 rounded mb-4" />
                            <View className="flex-row space-x-3">
                                {[1, 2].map((i) => (
                                    <View key={i} className="flex-1 h-14 bg-zinc-800 rounded-xl" />
                                ))}
                            </View>
                        </View>

                        {/* Nutrition Targets Skeleton */}
                        <View className="mb-6">
                            <View className="w-40 h-7 bg-zinc-800 rounded mb-4" />
                            <View className="bg-zinc-800 rounded-3xl p-5">
                                {[1, 2, 3].map((i) => (
                                    <View key={i} className="mb-4">
                                        <View className="flex-row items-center justify-between mb-2">
                                            <View className="w-20 h-4 bg-zinc-700 rounded" />
                                            <View className="w-24 h-4 bg-zinc-700 rounded" />
                                        </View>
                                        <View className="bg-zinc-700 h-2 rounded-full" />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <View className="mb-6 bg-red-900/20 border border-red-500/30 rounded-3xl p-5">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="alert-circle" size={24} color="#EF4444" />
                            <Text className="text-red-400 font-bold ml-2">Error Loading Plan</Text>
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

                {/* No Active Plan - Empty State */}
                {!isLoading && !error && !activePlan && (
                    <View className="mb-6">
                        <Text className="text-white text-xl font-bold mb-4">Active Meal Plan</Text>
                        <View className="bg-zinc-800 rounded-3xl p-8 items-center">
                            <View className="w-20 h-20 rounded-full bg-zinc-700 items-center justify-center mb-4">
                                <Ionicons name="calendar-outline" size={40} color="#71717a" />
                            </View>
                            <Text className="text-white text-lg font-bold mb-2 text-center">
                                No Active Meal Plan
                            </Text>
                            <Text className="text-gray-400 text-center mb-6 text-sm">
                                Generate a personalized AI meal plan to start tracking your nutrition and reaching your goals
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
                                        <Ionicons name="sparkles" size={20} color="white" />
                                        <Text className="text-white font-bold ml-2">Generate AI Meal Plan</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push("/diet-plan/health-conditions" as any)}
                                className="mt-3"
                            >
                                <Text className="text-purple-400 text-sm font-semibold">
                                    Or browse health condition plans →
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Active Meal Plan - Show when plan exists */}
                {!isLoading && !error && activePlan && (
                    <View className="mb-6">
                        <Text className="text-white text-xl font-bold mb-4">Active Meal Plan</Text>
                        <View className="overflow-hidden rounded-3xl">
                            <LinearGradient
                                colors={["#047857", "#065f46"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="p-5"
                            >
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2">
                                            <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                                                <Text className="text-white text-xs font-bold">ACTIVE</Text>
                                            </View>
                                            <View className="bg-white/20 px-3 py-1 rounded-full">
                                                <Text className="text-white text-xs font-bold">
                                                    {activePlan.duration} DAYS
                                                </Text>
                                            </View>
                                        </View>
                                        <Text className="text-white text-xl font-bold mb-1">
                                            {activePlan.goalType === 'lose' ? 'Weight Loss Plan' :
                                                activePlan.goalType === 'gain' ? 'Muscle Gain Plan' :
                                                    'Maintenance Plan'}
                                        </Text>
                                        <Text className="text-white/80 text-sm">
                                            {activePlan.targetCalories.toLocaleString()} cal/day • {activePlan.macroTargets.protein}g protein
                                        </Text>
                                    </View>
                                    <View className="flex-col">
                                        <TouchableOpacity onPress={handleDeletePlan} style={{ backgroundColor: 'rgba(202, 42, 17, 1)' }} className="rounded-full px-3 py-1.5 flex-row items-center mb-3">
                                            <Ionicons name="trash" size={14} color="#edededff" />
                                            <Text className="text-white text-sm font-bold ml-2">Cancel Plan</Text>
                                        </TouchableOpacity>
                                        <View className="w-12 h-10 bg-white/20 rounded-full items-center justify-center ml-11">
                                            <Text className="text-2xl">
                                                {activePlan.goalType === 'lose' ? '🔥' :
                                                    activePlan.goalType === 'gain' ? '💪' : '⚖️'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="h-px bg-white/20 my-3" />
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-white/70 text-xs">Plan Progress</Text>
                                        <Text className="text-white text-lg font-bold">
                                            Day {dietPlanningService.getPlanStatistics(activePlan).currentDay} of {activePlan.duration}
                                        </Text>
                                    </View>
                                    <View className="bg-white/20 h-2 rounded-full flex-1 mx-4">
                                        <View
                                            className="bg-white h-2 rounded-full"
                                            style={{
                                                width: `${Math.min((dietPlanningService.getPlanStatistics(activePlan).currentDay / activePlan.duration) * 100, 100)}%`
                                            }}
                                        />
                                    </View>
                                    <Text className="text-white/90 text-sm font-semibold">
                                        {Math.round((dietPlanningService.getPlanStatistics(activePlan).currentDay / activePlan.duration) * 100)}%
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>
                )}

                {/* Only show these sections when there's an active plan */}
                {!isLoading && !error && activePlan && (
                    <>
                        {/* Today's Overview (Quick Stats - 4 Cards) */}
                        <View className="mb-6">
                            <Text className="text-white text-xl font-bold mb-4">Today's Overview</Text>
                            <View className="flex-row flex-wrap justify-between">
                                {quickStats.map((stat, index) => (
                                    <View key={index} className="w-[49%] bg-zinc-800 rounded-2xl p-3 mb-2">
                                        <View className="flex-row items-center mb-2">
                                            <View
                                                className="w-9 h-9 rounded-full items-center justify-center mr-2"
                                                style={{ backgroundColor: `${stat.color}20` }}
                                            >
                                                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                                            </View>
                                            <Text className="text-white text-xl font-bold">{stat.value}</Text>
                                        </View>
                                        <Text className="text-gray-400 text-xs">{stat.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        {/* Overall Nutrition Breakdown */}
                        <View className="mb-6">
                            <Text className="text-white text-xl font-bold mb-4">Overall Nutrition Status</Text>
                            <View className="bg-zinc-800 rounded-3xl p-5">
                                {overallNutrition.hasData ? (
                                    <>
                                        <Text className="text-gray-400 text-sm mb-4">Based on completed meals</Text>

                                        {/* Macros */}
                                        <View className="mb-4">
                                            <Text className="text-white font-semibold mb-3">Macronutrients (Daily Avg)</Text>
                                            {overallNutrition.macros.map((macro, idx) => {
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
                                            <Text className="text-white font-semibold mb-3">Key Micronutrients (Daily Avg)</Text>
                                            {overallNutrition.micronutrients.map((nutrient, idx) => (
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
                                    </>
                                ) : (
                                    <Text className="text-gray-500 text-center py-8">
                                        Complete meals to see your nutrition progress
                                    </Text>
                                )}
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
                                        colors={["#EAB308", "#EA580C"]}
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
                                        colors={["#7C3AED", "#4F46E5"]}
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
                                        colors={["#047857", "#065f46"]}
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
                    </>
                )}
            </ScrollView>

            {/* Dialog Component */}
            <Dialog
                visible={showDialog}
                type={dialogType}
                title={dialogTitle}
                message={dialogMessage}
                onClose={() => setShowDialog(false)}
                onConfirm={() => {
                    if (dialogAction) {
                        dialogAction()
                    }
                    setShowDialog(false)
                }}
                onCancel={() => setShowDialog(false)}
                confirmText={dialogType === 'confirm' ? 'Yes, Cancel Plan' : 'OK'}
                cancelText="Keep Plan"
                showCancelButton={dialogType === 'confirm'}
                autoClose={dialogType === 'success' || dialogType === 'error'}
                autoCloseTime={2500}
            />
        </SafeAreaView>
    )
}

export default DietPlanningScreen

