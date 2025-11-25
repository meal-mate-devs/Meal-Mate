"use client"

import Dialog from "@/components/atoms/Dialog"
import { useLanguage } from "@/context/LanguageContext"
import { useDietPlanningStore } from "@/hooks/useDietPlanningStore"
import { DIET_GOALS } from "@/lib/constants/dietPlanning"
import { DietPlan, dietPlanningService } from "@/lib/services/dietPlanningService"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import { RefreshControl, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

const DietPlanningScreen = () => {
    const router = useRouter()
    const { t } = useLanguage()
    const {
        selectedGoal,
        streakData,
        getTodayStats,
        setGoal,
        setWaterIntake,
        setTodayMeals,
    } = useDietPlanningStore()

    const [activePlan, setActivePlan] = useState<DietPlan | null>(null)
    const [isLoadingPlan, setIsLoadingPlan] = useState(true)
    const [isLoadingStats, setIsLoadingStats] = useState(true)
    const [isLoadingNutrition, setIsLoadingNutrition] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDeletingPlan, setIsDeletingPlan] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    // Dialog states
    const [showDialog, setShowDialog] = useState(false)
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'confirm'>('confirm')
    const [dialogTitle, setDialogTitle] = useState('')
    const [dialogMessage, setDialogMessage] = useState('')
    const [dialogAction, setDialogAction] = useState<(() => void) | null>(null)

    // Fetch active plan from backend
    useEffect(() => {
        fetchActivePlan()
        loadStatsData()
        loadNutritionData()
    }, [])

    // Refresh data when screen comes into focus (after generating new plan)
    useFocusEffect(
        React.useCallback(() => {
            fetchActivePlan()
            loadStatsData()
            loadNutritionData()
        }, [])
    )

    const fetchActivePlan = async () => {
        try {
            setIsLoadingPlan(true)
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
            setIsLoadingPlan(false)
        }
    }

    const loadStatsData = async () => {
        try {
            setIsLoadingStats(true)
            // Stats data is derived from the store, so we just need to wait a bit
            // The actual data comes from getTodayStats() which uses the store
            await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
            console.log('Error loading stats:', error)
        } finally {
            setIsLoadingStats(false)
        }
    }

    const loadNutritionData = async () => {
        try {
            setIsLoadingNutrition(true)
            // Nutrition data is calculated from activePlan, so we just need to wait a bit
            await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
            console.log('Error loading nutrition:', error)
        } finally {
            setIsLoadingNutrition(false)
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([
                fetchActivePlan(),
                loadStatsData(),
                loadNutritionData()
            ])
        } catch (error) {
            console.log('Error refreshing data:', error)
        } finally {
            setRefreshing(false)
        }
    }, [])

    const handleDeletePlan = async () => {
        if (!activePlan) return

        // Show confirmation dialog
        setDialogType('confirm')
        setDialogTitle(t('diet.deleteDietPlan'))
        setDialogMessage(t('diet.deletePlanConfirm'))
        setDialogAction(() => async () => {
            try {
                setIsDeletingPlan(true)
                await dietPlanningService.deletePlan(activePlan.planId)

                // Refresh the plan data
                await fetchActivePlan()

                // Show success dialog
                setDialogType('success')
                setDialogTitle(t('diet.planDeletedSuccess'))
                setDialogMessage('')
                setDialogAction(null)
                setShowDialog(true)
            } catch (error: any) {
                console.log('Error deleting plan:', error)
                setDialogType('error')
                setDialogTitle(t('diet.failedToDeletePlan'))
                setDialogMessage(error.message || t('diet.failedToDeletePlan'))
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
            { name: t('diet.protein'), current: avgProtein, target: proteinTarget, unit: "g", color: "#10B981" },
            { name: t('diet.carbs'), current: avgCarbs, target: carbsTarget, unit: "g", color: "#3B82F6" },
            { name: t('diet.fat'), current: avgFats, target: fatsTarget, unit: "g", color: "#F97316" },
        ]

        // Micronutrient daily targets (RDA)
        const micronutrients = [
            { name: t('diet.vitaminD'), current: avgVitaminD, target: 15, status: Math.min(Math.round((avgVitaminD / 15) * 100), 100), color: "#F97316" },
            { name: t('diet.calcium'), current: avgCalcium, target: 1000, status: Math.min(Math.round((avgCalcium / 1000) * 100), 100), color: "#10B981" },
            { name: t('diet.iron'), current: avgIron, target: 18, status: Math.min(Math.round((avgIron / 18) * 100), 100), color: "#FACC15" },
            { name: t('diet.vitaminC'), current: avgVitaminC, target: 90, status: Math.min(Math.round((avgVitaminC / 90) * 100), 100), color: "#10B981" },
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
            label: t('diet.todaysMeals'),
            value: `${stats.mealsCompleted}/${stats.totalMeals}`,
            icon: "restaurant-outline",
            color: "#10B981",
        },
        {
            label: t('diet.caloriesToday'),
            value: stats.caloriesRemaining.toString(),
            icon: "flame-outline",
            color: "#F97316",
        },
        {
            label: t('diet.waterIntake'),
            value: `${stats.waterIntake}/${activePlan?.dailyWaterTarget || stats.waterTarget}`,
            icon: "water-outline",
            color: "#3B82F6",
        },
        {
            label: t('diet.dayStreak'),
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
                    <Text className="text-white text-xl font-bold">{t('diet.screenTitle')}</Text>
                </View>
                <Text className="text-gray-400 text-center">{t('diet.personalizeNutrition')}</Text>
            </View>

            <ScrollView
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#8B5CF6"
                        colors={["#8B5CF6"]}
                    />
                }
            >

                {/* Error State */}
                {error && (
                    <View className="mb-6 bg-red-900/20 border border-red-500/30 rounded-3xl p-5">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="alert-circle" size={24} color="#EF4444" />
                            <Text className="text-red-400 font-bold ml-2">{t('diet.errorLoadingPlan')}</Text>
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
                {!isLoadingPlan && !error && !activePlan && (
                    <View className="mb-6">
                        <Text className="text-white text-xl font-bold mb-4">{t('diet.activeMealPlan')}</Text>
                        <View className="bg-zinc-800 rounded-3xl p-8 items-center">
                            <View className="w-20 h-20 rounded-full bg-zinc-700 items-center justify-center mb-4">
                                <Ionicons name="calendar-outline" size={40} color="#71717a" />
                            </View>
                            <Text className="text-white text-lg font-bold mb-2 text-center">
                                {t('diet.noActivePlan')}
                            </Text>
                            <Text className="text-gray-400 text-center mb-6 text-sm">
                                {t('diet.generatePersonalizedPlan')}
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
                                        <Text className="text-white font-bold ml-2">{t('diet.generateAIMealPlanButton')}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push("/diet-plan/health-conditions" as any)}
                                className="mt-3"
                            >
                                <Text className="text-purple-400 text-sm font-semibold">
                                    {t('diet.browseHealthConditionPlans')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Active Meal Plan - Show when plan exists */}
                {!isLoadingPlan && !error && activePlan && (
                    <View className="mb-6">
                        <Text className="text-white text-xl font-bold mb-4">{t('diet.activeMealPlan')}</Text>
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
                                                <Text className="text-white text-xs font-bold">{t('diet.active').toUpperCase()}</Text>
                                            </View>
                                            <View className="bg-white/20 px-3 py-1 rounded-full">
                                                <Text className="text-white text-xs font-bold">
                                                    {activePlan.duration} {t('diet.days').toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text className="text-white text-xl font-bold mb-1">
                                            {activePlan.goalType === 'lose' ? t('diet.weightLoss') :
                                                activePlan.goalType === 'gain' ? t('diet.muscleGain') :
                                                    t('diet.maintenance')} {t('diet.plan')}
                                        </Text>
                                        <Text className="text-white/80 text-sm">
                                            {activePlan.targetCalories.toLocaleString()} cal/day • {activePlan.macroTargets.protein}g protein
                                        </Text>
                                    </View>
                                    <View className="flex-col">
                                        <TouchableOpacity onPress={handleDeletePlan} style={{ backgroundColor: 'rgba(202, 42, 17, 1)' }} className="rounded-full px-3 py-1.5 flex-row items-center mb-3">
                                            <Ionicons name="trash" size={14} color="#edededff" />
                                            <Text className="text-white text-sm font-bold ml-2">{t('diet.cancelPlan')}</Text>
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
                                        <Text className="text-white/70 text-xs">{t('diet.planProgress')}</Text>
                                        <Text className="text-white text-lg font-bold">
                                            {t('diet.dayOf', { current: dietPlanningService.getPlanStatistics(activePlan).currentDay, total: activePlan.duration })}
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

                {/* Active Plan Loading Skeleton */}
                {isLoadingPlan && !error && (
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
                )}

                {/* Only show these sections when there's an active plan */}
                {!isLoadingPlan && !error && activePlan && (
                    <>
                        {/* Today's Overview (Quick Stats - 4 Cards) */}
                        <View className="mb-6">
                            <Text className="text-white text-xl font-bold mb-4">{t('diet.todaysOverview')}</Text>
                            {isLoadingStats ? (
                                <View className="flex-row flex-wrap justify-between">
                                    {[1, 2, 3, 4].map((i) => (
                                        <View key={i} className="w-[49%] bg-zinc-800 rounded-2xl p-3 mb-2">
                                            <View className="flex-row items-center mb-2">
                                                <View className="w-9 h-9 bg-zinc-700 rounded-full mr-2" />
                                                <View className="w-12 h-5 bg-zinc-700 rounded" />
                                            </View>
                                            <View className="w-20 h-4 bg-zinc-700 rounded" />
                                        </View>
                                    ))}
                                </View>
                            ) : (
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
                            )}
                        </View>
                        {/* Overall Nutrition Breakdown */}
                        <View className="mb-6">
                            <Text className="text-white text-xl font-bold mb-4">{t('diet.overallNutritionStatus')}</Text>
                            <View className="bg-zinc-800 rounded-3xl p-5">
                                {isLoadingNutrition ? (
                                    <>
                                        <View className="w-48 h-4 bg-zinc-700 rounded mb-4" />
                                        <View className="mb-4">
                                            <View className="w-40 h-5 bg-zinc-700 rounded mb-3" />
                                            {[1, 2, 3].map((i) => (
                                                <View key={i} className="mb-3">
                                                    <View className="flex-row items-center justify-between mb-1">
                                                        <View className="w-20 h-4 bg-zinc-700 rounded" />
                                                        <View className="w-24 h-4 bg-zinc-700 rounded" />
                                                    </View>
                                                    <View className="bg-zinc-700 h-2 rounded-full" />
                                                </View>
                                            ))}
                                        </View>
                                        <View className="h-px bg-zinc-700 my-4" />
                                        <View>
                                            <View className="w-48 h-5 bg-zinc-700 rounded mb-3" />
                                            {[1, 2, 3, 4].map((i) => (
                                                <View key={i} className="flex-row items-center justify-between mb-3">
                                                    <View className="w-24 h-4 bg-zinc-700 rounded flex-1 mr-4" />
                                                    <View className="flex-row items-center">
                                                        <View className="bg-zinc-700 h-2 rounded-full w-20 mr-2" />
                                                        <View className="w-10 h-4 bg-zinc-700 rounded" />
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </>
                                ) : overallNutrition.hasData ? (
                                    <>
                                        <Text className="text-gray-400 text-sm mb-4">{t('diet.basedOnCompletedMeals')}</Text>

                                        {/* Macros */}
                                        <View className="mb-4">
                                            <Text className="text-white font-semibold mb-3">{t('diet.macronutrientsDailyAvg')}</Text>
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
                                            <Text className="text-white font-semibold mb-3">{t('diet.keyMicronutrientsDailyAvg')}</Text>
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
                                        {t('diet.completeMealsToSeeProgress')}
                                    </Text>
                                )}
                            </View>
                        </View>

                    </>
                )}

                {/* Main Features - Always Visible */}
                <View className="mb-6">
                    <Text className="text-white text-xl font-bold mb-4">{t('diet.features')}</Text>

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
                                                <Text className="text-white text-lg font-bold mr-2">{t('diet.mealTracking')}</Text>
                                                <View className="bg-white/30 px-2 py-1 rounded-full">
                                                    <Text className="text-white text-xs font-bold">{t('diet.track')}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-white/80 text-sm">
                                                {t('diet.mealsWaterVitaminsNutrients')}
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
                                                <Text className="text-white text-lg font-bold mr-2">{t('diet.aiMealPlans')}</Text>
                                                <View className="bg-white/30 px-2 py-1 rounded-full">
                                                    <Text className="text-white text-xs font-bold">{t('diet.ai')}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-white/80 text-sm">
                                                {t('diet.generateCustomWeeklyMonthlyPlans')}
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
                                            <Text className="text-white text-lg font-bold mb-1">{t('diet.healthConditions')}</Text>
                                            <Text className="text-white/80 text-sm">{t('diet.specializedDietaryPlans')}</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="white" />
                                </View>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Nutrition Tips Section - Always Visible */}
                <View className="mb-8">
                    <Text className="text-white text-xl font-bold mb-4">{t('diet.quickTips')}</Text>
                    <View className="bg-zinc-800 rounded-2xl p-5">
                        <View className="flex-row items-start mb-3">
                            <View className="w-8 h-8 rounded-full bg-green-900/30 items-center justify-center mr-3">
                                <Ionicons name="bulb-outline" size={18} color="#10B981" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-semibold mb-1">{t('diet.stayConsistent')}</Text>
                                <Text className="text-gray-400 text-sm">
                                    {t('diet.trackMealsDailyBuildHabits')}
                                </Text>
                            </View>
                        </View>
                        <View className="h-px bg-zinc-700 my-3" />
                        <View className="flex-row items-start">
                            <View className="w-8 h-8 rounded-full bg-blue-900/30 items-center justify-center mr-3">
                                <Ionicons name="water-outline" size={18} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-semibold mb-1">{t('diet.stayHydrated')}</Text>
                                <Text className="text-gray-400 text-sm">
                                    {t('diet.drinkWaterThroughoutDay')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
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

